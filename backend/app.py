from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from datetime import datetime
import os

from config import Config
from models import db, User, Role, AttendanceSync, SyncApproval
from face_recognition import FaceRecognitionService
from auth import role_required, admin_required, supervisor_or_admin_required
from init_db import init_database
from version import __version__, __app_name__
from mongo_service import mongo_service

# Detectar si estamos en modo producción (si existe el directorio dist/)
DIST_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'dist')
PRODUCTION_MODE = os.path.exists(DIST_DIR)

if PRODUCTION_MODE:
    # En producción, servir el frontend desde el directorio dist/
    app = Flask(__name__, static_folder=DIST_DIR, static_url_path='')
    print(f"[INFO] Modo producción activado - sirviendo frontend desde {DIST_DIR}")
else:
    # En desarrollo, no servir archivos estáticos
    app = Flask(__name__)
    print("[INFO] Modo desarrollo activado")

app.config.from_object(Config)

CORS(app)

db.init_app(app)
jwt = JWTManager(app)

face_service = FaceRecognitionService()

blocklisted_tokens = set()

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    """Verifica si el token está en la lista negra"""
    jti = jwt_payload['jti']
    return jti in blocklisted_tokens


@jwt.invalid_token_loader
def invalid_token_callback(error_string):
    """Maneja tokens inválidos"""
    print(f"[JWT ERROR] Token inválido: {error_string}")
    return jsonify({
        "success": False,
        "message": "Token inválido"
    }), 422


@jwt.unauthorized_loader
def missing_token_callback(error_string):
    """Maneja tokens faltantes"""
    print(f"[JWT ERROR] Token faltante: {error_string}")
    return jsonify({
        "success": False,
        "message": "Token de autenticación requerido"
    }), 401


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    """Maneja tokens expirados"""
    print(f"[JWT ERROR] Token expirado: {jwt_payload}")
    return jsonify({
        "success": False,
        "message": "Token expirado"
    }), 401


@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    """Maneja tokens revocados"""
    print(f"[JWT ERROR] Token revocado: {jwt_payload}")
    return jsonify({
        "success": False,
        "message": "Token revocado"
    }), 401


@app.route('/api/health', methods=['GET'])
def health():
    """Verifica estado del servidor"""
    return jsonify({
        "status": "ok",
        "version": __version__,
        "app_name": __app_name__,
        "trained": face_service.trained,
        "workers_count": len(face_service.names),
        "auth_enabled": True
    })


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Endpoint de inicio de sesión"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({
                "success": False,
                "message": "Usuario y contraseña requeridos"
            }), 400
        
        user = User.query.filter_by(username=username).first()
        
        if not user or not user.check_password(password):
            return jsonify({
                "success": False,
                "message": "Credenciales inválidas"
            }), 401
        
        if not user.is_active:
            return jsonify({
                "success": False,
                "message": "Usuario inactivo"
            }), 403
        
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Identity debe ser string, usamos el user_id
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "username": user.username,
                "role": user.role.name
            }
        )
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return jsonify({
            "success": True,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresca el token de acceso"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        new_access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "username": user.username,
                "role": user.role.name
            }
        )
        
        return jsonify({
            "success": True,
            "access_token": new_access_token
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    """Cierra sesión revocando el token"""
    try:
        jti = get_jwt()['jti']
        blocklisted_tokens.add(jti)
        
        return jsonify({
            "success": True,
            "message": "Sesión cerrada exitosamente"
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Obtiene información del usuario actual"""
    try:
        current_user_data = get_jwt_identity()
        user = User.query.get(current_user_data['id'])
        
        if not user:
            return jsonify({
                "success": False,
                "message": "Usuario no encontrado"
            }), 404
        
        return jsonify({
            "success": True,
            "user": user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/users', methods=['GET'])
@jwt_required()
@admin_required()
def get_users():
    """Obtiene lista de usuarios (solo admin)"""
    try:
        users = User.query.all()
        return jsonify({
            "success": True,
            "users": [user.to_dict() for user in users],
            "count": len(users)
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/users', methods=['POST'])
@jwt_required()
@admin_required()
def create_user():
    """Crea un nuevo usuario (solo admin)"""
    try:
        data = request.get_json()
        
        required_fields = ['username', 'email', 'password', 'role_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    "success": False,
                    "message": f"Campo requerido: {field}"
                }), 400
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({
                "success": False,
                "message": "El nombre de usuario ya existe"
            }), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({
                "success": False,
                "message": "El email ya está registrado"
            }), 400
        
        role = Role.query.get(data['role_id'])
        if not role:
            return jsonify({
                "success": False,
                "message": "Rol no válido"
            }), 400
        
        new_user = User(
            username=data['username'],
            email=data['email'],
            full_name=data.get('full_name', ''),
            role_id=data['role_id'],
            is_active=data.get('is_active', True)
        )
        new_user.set_password(data['password'])
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Usuario creado exitosamente",
            "user": new_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@admin_required()
def update_user(user_id):
    """Actualiza un usuario (solo admin)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                "success": False,
                "message": "Usuario no encontrado"
            }), 404
        
        data = request.get_json()
        
        if 'username' in data and data['username'] != user.username:
            if User.query.filter_by(username=data['username']).first():
                return jsonify({
                    "success": False,
                    "message": "El nombre de usuario ya existe"
                }), 400
            user.username = data['username']
        
        if 'email' in data and data['email'] != user.email:
            if User.query.filter_by(email=data['email']).first():
                return jsonify({
                    "success": False,
                    "message": "El email ya está registrado"
                }), 400
            user.email = data['email']
        
        if 'full_name' in data:
            user.full_name = data['full_name']
        
        if 'role_id' in data:
            role = Role.query.get(data['role_id'])
            if not role:
                return jsonify({
                    "success": False,
                    "message": "Rol no válido"
                }), 400
            user.role_id = data['role_id']
        
        if 'is_active' in data:
            user.is_active = data['is_active']
        
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Usuario actualizado exitosamente",
            "user": user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required()
def delete_user(user_id):
    """Elimina un usuario (solo admin)"""
    try:
        current_user_data = get_jwt_identity()
        
        if current_user_data['id'] == user_id:
            return jsonify({
                "success": False,
                "message": "No puedes eliminar tu propia cuenta"
            }), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                "success": False,
                "message": "Usuario no encontrado"
            }), 404
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Usuario eliminado exitosamente"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/roles', methods=['GET'])
@jwt_required()
def get_roles():
    """Obtiene lista de roles disponibles"""
    try:
        roles = Role.query.all()
        return jsonify({
            "success": True,
            "roles": [role.to_dict() for role in roles],
            "count": len(roles)
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/detect', methods=['POST'])
@jwt_required()
def detect_face():
    """Detecta si hay un rostro en la imagen"""
    try:
        data = request.get_json()
        base64_image = data.get('image')
        
        if not base64_image:
            return jsonify({"success": False, "message": "No se proporcionó imagen"}), 400
        
        img = face_service.base64_to_image(base64_image)
        coords, face_roi, gray = face_service.detect_face(img)
        
        if coords is None:
            return jsonify({
                "success": True,
                "face_detected": False,
                "message": "No se detectó rostro"
            })
        
        return jsonify({
            "success": True,
            "face_detected": True,
            "coords": coords,
            "message": "Rostro detectado"
        })
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/recognize', methods=['POST'])
@jwt_required()
def recognize():
    """Reconoce trabajador en imagen"""
    try:
        data = request.get_json()
        base64_image = data.get('image')
        
        if not base64_image:
            return jsonify({"success": False, "message": "No se proporcionó imagen"}), 400
        
        result = face_service.recognize_face(base64_image)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/register', methods=['POST'])
@jwt_required()
@admin_required()  # Solo admin puede registrar trabajadores
def register():
    """Registra nuevo trabajador (solo admin)"""
    try:
        from models import Worker
        data = request.get_json()
        base64_image = data.get('image')
        worker_name = data.get('name')
        current_user_id = get_jwt_identity()
        
        if not base64_image or not worker_name:
            return jsonify({
                "success": False, 
                "message": "Se requiere imagen y nombre"
            }), 400
        
        # Verificar si el trabajador ya existe
        existing_worker = Worker.query.filter_by(name=worker_name).first()
        if existing_worker:
            return jsonify({
                "success": False,
                "message": f"El trabajador '{worker_name}' ya está registrado"
            }), 400
        
        # Registrar en el sistema de reconocimiento facial
        result = face_service.register_worker(base64_image, worker_name)
        
        if result.get('success'):
            # Guardar en la base de datos
            photo_path = f"dataset/{worker_name}.jpg"
            new_worker = Worker(
                name=worker_name,
                photo_path=photo_path,
                registered_by=int(current_user_id)
            )
            db.session.add(new_worker)
            db.session.commit()
            
            result['worker'] = new_worker.to_dict()
        
        return jsonify(result)
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/workers', methods=['GET'])
def get_workers():
    """Obtiene lista de trabajadores registrados (público)"""
    try:
        from models import Worker
        
        # Obtener trabajadores desde la base de datos
        workers_db = Worker.query.filter_by(is_active=True).all()
        workers_list = [w.to_dict() for w in workers_db]
        
        # Si no hay en BD, usar el sistema de archivos como fallback
        if not workers_list:
            workers_names = face_service.get_registered_workers()
            workers_list = [{"name": name} for name in workers_names]
        
        return jsonify({
            "success": True,
            "workers": workers_list,
            "count": len(workers_list)
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/workers/<worker_name>/photo', methods=['GET'])
def get_worker_photo(worker_name):
    """Obtiene la foto de un trabajador registrado"""
    try:
        dataset_path = os.path.join(os.path.dirname(__file__), 'dataset')
        filename = f"{worker_name}.jpg"
        
        if not os.path.exists(os.path.join(dataset_path, filename)):
            return jsonify({
                "success": False,
                "message": "Foto no encontrada"
            }), 404
        
        return send_from_directory(dataset_path, filename, mimetype='image/jpeg')
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/workers/<worker_name>', methods=['DELETE'])
@jwt_required()
@admin_required()  # Solo admin puede eliminar trabajadores
def delete_worker(worker_name):
    """Elimina un trabajador del sistema (solo admin)"""
    try:
        from models import Worker
        
        # Eliminar de la base de datos
        worker = Worker.query.filter_by(name=worker_name).first()
        if worker:
            db.session.delete(worker)
            db.session.commit()
        
        # Eliminar del sistema de reconocimiento facial
        result = face_service.delete_worker(worker_name)
        return jsonify(result)
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/retrain', methods=['POST'])
@jwt_required()
@supervisor_or_admin_required()
def retrain():
    """Re-entrena el modelo con el dataset actual (supervisor o admin)"""
    try:
        face_service.load_and_train()
        return jsonify({
            "success": True,
            "message": "Modelo re-entrenado exitosamente",
            "workers_count": len(face_service.names)
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/sync/upload', methods=['POST'])
@jwt_required()
def sync_upload():
    """Recibe registros de asistencia del cliente para sincronizar"""
    try:
        data = request.get_json()
        records = data.get('records', [])
        
        if not records:
            return jsonify({
                "success": False,
                "message": "No se proporcionaron registros"
            }), 400
        
        synced_count = 0
        for record in records:
            existing = AttendanceSync.query.filter_by(
                worker_id=record['workerId'],
                timestamp=datetime.fromisoformat(record['timestamp'])
            ).first()
            
            if not existing:
                new_record = AttendanceSync(
                    worker_id=record['workerId'],
                    worker_name=record['workerName'],
                    type=record['type'],
                    timestamp=datetime.fromisoformat(record['timestamp']),
                    confidence=record.get('confidence'),
                    client_id=record.get('clientId')
                )
                db.session.add(new_record)
                synced_count += 1
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"{synced_count} registros sincronizados",
            "synced_count": synced_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/sync/download', methods=['GET'])
@jwt_required()
def sync_download():
    """Descarga registros de asistencia desde el servidor"""
    try:
        since = request.args.get('since')
        
        query = AttendanceSync.query
        if since:
            since_date = datetime.fromisoformat(since)
            query = query.filter(AttendanceSync.synced_at >= since_date)
        
        records = query.order_by(AttendanceSync.timestamp.desc()).limit(1000).all()
        
        return jsonify({
            "success": True,
            "records": [record.to_dict() for record in records],
            "count": len(records)
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/stats', methods=['GET'])
@jwt_required()
@supervisor_or_admin_required()
def get_stats():
    """Obtiene estadísticas del sistema"""
    try:
        total_workers = len(face_service.names)
        total_users = User.query.count()
        total_records = AttendanceSync.query.count()
        
        today = datetime.utcnow().date()
        today_records = AttendanceSync.query.filter(
            db.func.date(AttendanceSync.timestamp) == today
        ).count()
        
        return jsonify({
            "success": True,
            "stats": {
                "total_workers": total_workers,
                "total_users": total_users,
                "total_records": total_records,
                "today_records": today_records,
                "model_trained": face_service.trained
            }
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/sync/request-approval', methods=['POST'])
@jwt_required()
def request_sync_approval():
    """Solicita aprobación para sincronizar datos"""
    try:
        import json
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}
        
        # Verificar si ya hay una solicitud pendiente
        existing = SyncApproval.query.filter_by(
            requested_by=int(current_user_id),
            status='pending'
        ).first()
        
        if existing:
            return jsonify({
                "success": False,
                "message": "Ya tienes una solicitud de sincronización pendiente"
            }), 400
        
        # Capturar resumen de registros a sincronizar
        records = data.get('records', [])
        records_count = len(records)
        
        # Crear resumen compacto de los registros
        records_summary = [
            {
                'id': r.get('id'),
                'workerName': r.get('workerName'),
                'type': r.get('type'),
                'date': r.get('date'),
                'time': r.get('time')
            }
            for r in records[:50]  # Máximo 50 registros en el resumen
        ]
        
        # Crear nueva solicitud con información de registros
        approval = SyncApproval(
            requested_by=int(current_user_id),
            records_count=records_count,
            records_summary=json.dumps(records_summary, ensure_ascii=False)
        )
        db.session.add(approval)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Solicitud de sincronización enviada",
            "approval": approval.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/sync/approval-status', methods=['GET'])
@jwt_required()
def get_sync_approval_status():
    """Obtiene el estado de la aprobación de sincronización"""
    try:
        current_user_id = get_jwt_identity()
        
        # Buscar aprobación pendiente o aprobada reciente
        approval = SyncApproval.query.filter_by(
            requested_by=int(current_user_id)
        ).order_by(SyncApproval.requested_at.desc()).first()
        
        if not approval:
            return jsonify({
                "success": True,
                "status": "none",
                "can_sync": False
            }), 200
        
        # Verificar si está aprobada y no ha expirado
        can_sync = approval.status == 'approved' and (
            approval.expires_at is None or approval.expires_at > datetime.utcnow()
        )
        
        return jsonify({
            "success": True,
            "status": approval.status,
            "can_sync": can_sync,
            "approval": approval.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/sync/pending-requests', methods=['GET'])
@jwt_required()
@supervisor_or_admin_required()
def get_pending_sync_requests():
    """Obtiene solicitudes de sincronización pendientes (supervisor/admin)"""
    try:
        pending = SyncApproval.query.filter_by(status='pending').all()
        
        return jsonify({
            "success": True,
            "requests": [req.to_dict() for req in pending],
            "count": len(pending)
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/sync/approve/<int:approval_id>', methods=['POST'])
@jwt_required()
@supervisor_or_admin_required()
def approve_sync_request(approval_id):
    """Aprueba o rechaza una solicitud de sincronización (supervisor/admin)"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        action = data.get('action')  # 'approve' or 'reject'
        
        approval = SyncApproval.query.get(approval_id)
        if not approval:
            return jsonify({
                "success": False,
                "message": "Solicitud no encontrada"
            }), 404
        
        if approval.status != 'pending':
            return jsonify({
                "success": False,
                "message": "Esta solicitud ya fue procesada"
            }), 400
        
        approval.approved_by = int(current_user_id)
        approval.approved_at = datetime.utcnow()
        
        if action == 'approve':
            approval.status = 'approved'
            # La aprobación expira en 1 hora
            from datetime import timedelta
            approval.expires_at = datetime.utcnow() + timedelta(hours=1)
            message = "Solicitud de sincronización aprobada"
        else:
            approval.status = 'rejected'
            message = "Solicitud de sincronización rechazada"
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": message,
            "approval": approval.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/mongo/sync-workers', methods=['POST'])
@jwt_required()
@admin_required()
def sync_workers_to_mongo():
    """
    Sincroniza trabajadores a MongoDB (Solo ADMIN)
    Requiere aprobación explícita del administrador
    """
    try:
        data = request.get_json()
        workers = data.get('workers', [])
        
        if not workers:
            return jsonify({
                "success": False,
                "message": "No hay trabajadores para sincronizar"
            }), 400
        
        result = mongo_service.sync_workers(workers)
        return jsonify(result), 200 if result["success"] else 500
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/mongo/sync-attendance', methods=['POST'])
@jwt_required()
@supervisor_or_admin_required()
def sync_attendance_to_mongo():
    """
    Sincroniza asistencias a MongoDB (SUPERVISOR o ADMIN)
    Requiere aprobación del supervisor/admin
    """
    try:
        data = request.get_json()
        attendance_records = data.get('attendance', [])
        
        if not attendance_records:
            return jsonify({
                "success": False,
                "message": "No hay registros de asistencia para sincronizar"
            }), 400
        
        result = mongo_service.sync_attendance(attendance_records)
        
        # NO marcamos como sincronizados - MongoDB es solo backup opcional
        # Los registros permanecen en cola local para sync primario
        
        return jsonify(result), 200 if result["success"] else 500
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/mongo/status', methods=['GET'])
@jwt_required()
def mongo_status():
    """Verifica el estado de la conexión a MongoDB"""
    is_connected = mongo_service.is_connected()
    return jsonify({
        "success": True,
        "connected": is_connected,
        "message": "Conectado a MongoDB" if is_connected else "Sin conexión a MongoDB"
    })


@app.route('/api/mongo/workers', methods=['GET'])
@jwt_required()
def get_mongo_workers():
    """Obtiene trabajadores desde MongoDB"""
    limit = request.args.get('limit', 100, type=int)
    result = mongo_service.get_workers(limit=limit)
    return jsonify(result), 200 if result["success"] else 500


@app.route('/api/mongo/attendance', methods=['GET'])
@jwt_required()
def get_mongo_attendance():
    """Obtiene registros de asistencia desde MongoDB"""
    worker_name = request.args.get('worker_name')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    limit = request.args.get('limit', 500, type=int)
    
    result = mongo_service.get_attendance(
        worker_name=worker_name,
        start_date=start_date,
        end_date=end_date,
        limit=limit
    )
    return jsonify(result), 200 if result["success"] else 500


@app.route('/api/mongo/workers', methods=['DELETE'])
@jwt_required()
@admin_required()
def delete_mongo_workers():
    """
    Elimina trabajadores de MongoDB (SOLO ADMIN)
    Requiere array de nombres de trabajadores
    """
    try:
        data = request.get_json()
        worker_names = data.get('worker_names', [])
        
        if not worker_names:
            return jsonify({
                "success": False,
                "message": "No se especificaron trabajadores para eliminar"
            }), 400
        
        result = mongo_service.delete_workers(worker_names)
        return jsonify(result), 200 if result["success"] else 500
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/mongo/attendance', methods=['DELETE'])
@jwt_required()
@admin_required()
def delete_mongo_attendance():
    """
    Elimina registros de asistencia de MongoDB (SOLO ADMIN)
    Requiere array de client_ids (IDs de IndexedDB)
    """
    try:
        data = request.get_json()
        client_ids = data.get('client_ids', [])
        
        if not client_ids:
            return jsonify({
                "success": False,
                "message": "No se especificaron registros para eliminar"
            }), 400
        
        result = mongo_service.delete_attendance(client_ids)
        return jsonify(result), 200 if result["success"] else 500
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/mongo/workers/clear-all', methods=['DELETE'])
@jwt_required()
@admin_required()
def clear_all_mongo_workers():
    """
    ELIMINA TODOS los trabajadores de MongoDB (SOLO ADMIN)
    OPERACIÓN DESTRUCTIVA - requiere confirmación en frontend
    """
    try:
        result = mongo_service.clear_all_workers()
        return jsonify(result), 200 if result["success"] else 500
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/mongo/attendance/clear-all', methods=['DELETE'])
@jwt_required()
@admin_required()
def clear_all_mongo_attendance():
    """
    ELIMINA TODOS los registros de asistencia de MongoDB (SOLO ADMIN)
    OPERACIÓN DESTRUCTIVA - requiere confirmación en frontend
    """
    try:
        result = mongo_service.clear_all_attendance()
        return jsonify(result), 200 if result["success"] else 500
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """
    En modo producción, sirve el frontend React.
    En modo desarrollo, retorna un mensaje informativo.
    """
    if not PRODUCTION_MODE:
        return jsonify({
            "message": "Modo desarrollo - el frontend se sirve desde Vite en puerto 5000",
            "api_docs": "/api/health"
        })
    
    # Si es una ruta API que no existe, retornar 404
    if path.startswith('api/'):
        return jsonify({"error": "Endpoint no encontrado"}), 404
    
    # Si el archivo existe, servirlo
    if path and os.path.exists(os.path.join(DIST_DIR, path)):
        return send_from_directory(DIST_DIR, path)
    
    # Para todas las demás rutas, servir index.html (React Router)
    return send_from_directory(DIST_DIR, 'index.html')


if __name__ == '__main__':
    with app.app_context():
        init_database(app)
        mongo_service.connect()
    
    port = int(os.environ.get('PORT', 8000))
    print(f"[INFO] Servidor iniciado en puerto {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
