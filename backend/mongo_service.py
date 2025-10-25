"""
Servicio MongoDB para sincronización segura de datos
Maneja la conexión y operaciones con MongoDB Atlas
"""
import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from datetime import datetime

class MongoService:
    def __init__(self):
        self.client = None
        self.db = None
        self.connected = False
        
    def connect(self):
        """Conecta a MongoDB Atlas de forma segura"""
        try:
            mongodb_uri = os.environ.get('MONGODB_URI')
            if not mongodb_uri:
                print("[MONGO WARNING] MONGODB_URI no configurado")
                return False
            
            self.client = MongoClient(
                mongodb_uri,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000,
                socketTimeoutMS=10000
            )
            
            self.client.admin.command('ping')
            
            db_name = 'facenomad'
            self.db = self.client[db_name]
            self.connected = True
            print(f"[MONGO INFO] Conectado exitosamente a MongoDB Atlas - DB: {db_name}")
            return True
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            print(f"[MONGO ERROR] No se pudo conectar a MongoDB: {e}")
            self.connected = False
            return False
        except Exception as e:
            print(f"[MONGO ERROR] Error inesperado: {e}")
            self.connected = False
            return False
    
    def disconnect(self):
        """Cierra la conexión a MongoDB"""
        if self.client:
            self.client.close()
            self.connected = False
            print("[MONGO INFO] Conexión a MongoDB cerrada")
    
    def is_connected(self):
        """Verifica si hay conexión activa"""
        if not self.connected or not self.client:
            return False
        try:
            self.client.admin.command('ping')
            return True
        except:
            self.connected = False
            return False
    
    def sync_workers(self, workers_data):
        """
        Sincroniza trabajadores a MongoDB
        Solo el ADMIN puede ejecutar esto
        """
        if not self.is_connected():
            return {"success": False, "message": "No hay conexión a MongoDB"}
        
        try:
            collection = self.db['workers']
            results = {
                "inserted": 0,
                "updated": 0,
                "errors": []
            }
            
            for worker in workers_data:
                try:
                    worker_doc = {
                        "name": worker.get('name'),
                        "registered_at": worker.get('registered_at', datetime.utcnow().isoformat()),
                        "photo_path": worker.get('photo_path'),
                        "synced_at": datetime.utcnow().isoformat(),
                        "status": "active"
                    }
                    
                    existing = collection.find_one({"name": worker.get('name')})
                    
                    if existing:
                        collection.update_one(
                            {"name": worker.get('name')},
                            {"$set": worker_doc}
                        )
                        results["updated"] += 1
                    else:
                        collection.insert_one(worker_doc)
                        results["inserted"] += 1
                        
                except Exception as e:
                    results["errors"].append(f"Error con {worker.get('name')}: {str(e)}")
            
            return {
                "success": True,
                "message": f"{results['inserted']} insertados, {results['updated']} actualizados",
                "details": results
            }
            
        except Exception as e:
            return {"success": False, "message": f"Error al sincronizar trabajadores: {str(e)}"}
    
    def sync_attendance(self, attendance_data):
        """
        Sincroniza registros de asistencia a MongoDB
        Solo SUPERVISOR o ADMIN pueden ejecutar esto
        """
        if not self.is_connected():
            return {"success": False, "message": "No hay conexión a MongoDB"}
        
        try:
            collection = self.db['attendance']
            results = {
                "inserted": 0,
                "errors": []
            }
            
            for record in attendance_data:
                try:
                    attendance_doc = {
                        "worker_name": record.get('workerName'),
                        "type": record.get('type'),
                        "date": record.get('date'),
                        "time": record.get('time'),
                        "timestamp": record.get('timestamp', datetime.utcnow().isoformat()),
                        "confidence": record.get('confidence'),
                        "synced_at": datetime.utcnow().isoformat(),
                        "client_id": record.get('id')
                    }
                    
                    existing = collection.find_one({
                        "client_id": record.get('id')
                    })
                    
                    if not existing:
                        collection.insert_one(attendance_doc)
                        results["inserted"] += 1
                        
                except Exception as e:
                    results["errors"].append(f"Error con registro {record.get('id')}: {str(e)}")
            
            return {
                "success": True,
                "message": f"{results['inserted']} registros sincronizados",
                "details": results
            }
            
        except Exception as e:
            return {"success": False, "message": f"Error al sincronizar asistencia: {str(e)}"}
    
    def get_workers(self, limit=100):
        """Obtiene trabajadores desde MongoDB"""
        if not self.is_connected():
            return {"success": False, "message": "No hay conexión a MongoDB"}
        
        try:
            collection = self.db['workers']
            workers = list(collection.find(
                {"status": "active"},
                {"_id": 0}
            ).limit(limit))
            
            return {
                "success": True,
                "workers": workers,
                "count": len(workers)
            }
        except Exception as e:
            return {"success": False, "message": f"Error al obtener trabajadores: {str(e)}"}
    
    def get_attendance(self, worker_name=None, start_date=None, end_date=None, limit=500):
        """Obtiene registros de asistencia desde MongoDB"""
        if not self.is_connected():
            return {"success": False, "message": "No hay conexión a MongoDB"}
        
        try:
            collection = self.db['attendance']
            query = {}
            
            if worker_name:
                query["worker_name"] = worker_name
            
            if start_date or end_date:
                query["date"] = {}
                if start_date:
                    query["date"]["$gte"] = start_date
                if end_date:
                    query["date"]["$lte"] = end_date
            
            records = list(collection.find(
                query,
                {"_id": 0}
            ).sort("timestamp", -1).limit(limit))
            
            return {
                "success": True,
                "records": records,
                "count": len(records)
            }
        except Exception as e:
            return {"success": False, "message": f"Error al obtener asistencias: {str(e)}"}
    
    def delete_workers(self, worker_names):
        """
        Elimina trabajadores de MongoDB
        Solo el ADMIN puede ejecutar esto
        """
        if not self.is_connected():
            return {"success": False, "message": "No hay conexión a MongoDB"}
        
        try:
            collection = self.db['workers']
            result = collection.delete_many({"name": {"$in": worker_names}})
            
            return {
                "success": True,
                "message": f"{result.deleted_count} trabajador(es) eliminado(s) de MongoDB",
                "deleted_count": result.deleted_count
            }
        except Exception as e:
            return {"success": False, "message": f"Error al eliminar trabajadores: {str(e)}"}
    
    def delete_attendance(self, client_ids):
        """
        Elimina registros de asistencia de MongoDB por sus client_id
        Solo el ADMIN puede ejecutar esto
        """
        if not self.is_connected():
            return {"success": False, "message": "No hay conexión a MongoDB"}
        
        try:
            collection = self.db['attendance']
            result = collection.delete_many({"client_id": {"$in": client_ids}})
            
            return {
                "success": True,
                "message": f"{result.deleted_count} registro(s) de asistencia eliminado(s) de MongoDB",
                "deleted_count": result.deleted_count
            }
        except Exception as e:
            return {"success": False, "message": f"Error al eliminar registros: {str(e)}"}
    
    def clear_all_workers(self):
        """
        Elimina TODOS los trabajadores de MongoDB
        Solo el ADMIN puede ejecutar esto - OPERACIÓN DESTRUCTIVA
        """
        if not self.is_connected():
            return {"success": False, "message": "No hay conexión a MongoDB"}
        
        try:
            collection = self.db['workers']
            result = collection.delete_many({})
            
            return {
                "success": True,
                "message": f"Todos los trabajadores eliminados de MongoDB ({result.deleted_count} registros)",
                "deleted_count": result.deleted_count
            }
        except Exception as e:
            return {"success": False, "message": f"Error al limpiar trabajadores: {str(e)}"}
    
    def clear_all_attendance(self):
        """
        Elimina TODOS los registros de asistencia de MongoDB
        Solo el ADMIN puede ejecutar esto - OPERACIÓN DESTRUCTIVA
        """
        if not self.is_connected():
            return {"success": False, "message": "No hay conexión a MongoDB"}
        
        try:
            collection = self.db['attendance']
            result = collection.delete_many({})
            
            return {
                "success": True,
                "message": f"Todos los registros de asistencia eliminados de MongoDB ({result.deleted_count} registros)",
                "deleted_count": result.deleted_count
            }
        except Exception as e:
            return {"success": False, "message": f"Error al limpiar asistencias: {str(e)}"}


mongo_service = MongoService()
