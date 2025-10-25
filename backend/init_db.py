from models import db, User, Role, AttendanceSync, SyncApproval
from datetime import datetime

def init_database(app):
    """Inicializa la base de datos y crea roles y usuario admin por defecto"""
    with app.app_context():
        db.create_all()
        
        if Role.query.count() == 0:
            print("[INFO] Creando roles por defecto...")
            
            admin_role = Role(
                name='admin',
                description='Administrador con acceso completo',
                permissions={
                    'manage_users': True,
                    'manage_workers': True,
                    'view_records': True,
                    'register_attendance': True,
                    'sync_data': True,
                    'manage_settings': True
                }
            )
            
            supervisor_role = Role(
                name='supervisor',
                description='Supervisor - solo visualización de historial',
                permissions={
                    'manage_users': False,
                    'manage_workers': False,
                    'view_records': True,
                    'register_attendance': False,
                    'sync_data': False,
                    'manage_settings': False
                }
            )
            
            operator_role = Role(
                name='operator',
                description='Operador solo para registrar asistencia',
                permissions={
                    'manage_users': False,
                    'manage_workers': False,
                    'view_records': False,
                    'register_attendance': True,
                    'sync_data': False,
                    'manage_settings': False
                }
            )
            
            db.session.add(admin_role)
            db.session.add(supervisor_role)
            db.session.add(operator_role)
            db.session.commit()
            
            print("[INFO] Roles creados exitosamente")
        
        if User.query.count() == 0:
            print("[INFO] Creando usuario administrador por defecto...")
            
            admin_role = Role.query.filter_by(name='admin').first()
            admin_user = User(
                username='admin',
                email='admin@facenomad.local',
                full_name='Administrador del Sistema',
                role_id=admin_role.id,
                is_active=True,
                created_at=datetime.utcnow()
            )
            admin_user.set_password('admin123')
            
            db.session.add(admin_user)
            db.session.commit()
            
            print("[INFO] Usuario administrador creado")
            print("[INFO] Usuario: admin")
            print("[INFO] Contraseña: admin123")
            print("[WARN] ¡CAMBIAR LA CONTRASEÑA INMEDIATAMENTE!")
