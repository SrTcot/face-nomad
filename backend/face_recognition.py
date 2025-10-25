import cv2
import os
import numpy as np
from datetime import datetime
import base64
from io import BytesIO
from PIL import Image

class FaceRecognitionService:
    def __init__(self, dataset_dir="dataset"):
        self.dataset_dir = dataset_dir
        self.face_cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        self.face_cascade = cv2.CascadeClassifier(self.face_cascade_path)
        self.recognizer = None
        self.names = {}
        self.trained = False
        
        if not os.path.exists(self.dataset_dir):
            os.makedirs(self.dataset_dir)
        
        self.load_and_train()
    
    def base64_to_image(self, base64_string):
        """Convierte imagen base64 a formato OpenCV"""
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        img_data = base64.b64decode(base64_string)
        img = Image.open(BytesIO(img_data))
        return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    
    def image_to_base64(self, image):
        """Convierte imagen OpenCV a base64"""
        _, buffer = cv2.imencode('.jpg', image)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        return f"data:image/jpeg;base64,{img_base64}"
    
    def detect_face(self, image):
        """Detecta rostro en imagen y retorna coordenadas"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
        
        if len(faces) == 0:
            return None, None, gray
        
        (x, y, w, h) = faces[0]
        face_roi = gray[y:y+h, x:x+w]
        
        return (x, y, w, h), face_roi, gray
    
    def load_and_train(self):
        """Carga imágenes del dataset y entrena el modelo"""
        faces_list = []
        labels_list = []
        self.names = {}
        label_id = 0
        
        print(f"[INFO] Cargando imágenes desde: {self.dataset_dir}")
        
        if not os.path.exists(self.dataset_dir):
            print("[WARN] Carpeta dataset no existe")
            return
        
        for filename in os.listdir(self.dataset_dir):
            if filename.lower().endswith((".jpg", ".png", ".jpeg")):
                path = os.path.join(self.dataset_dir, filename)
                img = cv2.imread(path)
                
                if img is None:
                    print(f"[WARN] No se pudo leer: {filename}")
                    continue
                
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                
                # Parámetros optimizados para mejor detección
                faces = self.face_cascade.detectMultiScale(
                    gray, 
                    scaleFactor=1.1,
                    minNeighbors=3,
                    minSize=(30, 30)
                )
                
                if len(faces) == 0:
                    print(f"[WARN] No se detectó rostro en: {filename}")
                    continue
                
                (x, y, w, h) = faces[0]
                face_roi = gray[y:y+h, x:x+w]
                
                faces_list.append(face_roi)
                labels_list.append(label_id)
                
                worker_name = os.path.splitext(filename)[0]
                self.names[label_id] = worker_name
                label_id += 1
        
        if len(faces_list) > 0:
            print(f"[INFO] {len(faces_list)} rostros cargados. Entrenando modelo...")
            self.recognizer = cv2.face.LBPHFaceRecognizer_create()
            self.recognizer.train(faces_list, np.array(labels_list))
            self.trained = True
            print("[INFO] Entrenamiento completado")
        else:
            print("[WARN] No hay rostros para entrenar")
            self.trained = False
    
    def recognize_face(self, base64_image):
        """Reconoce rostro en imagen base64"""
        try:
            img = self.base64_to_image(base64_image)
            coords, face_roi, gray = self.detect_face(img)
            
            if coords is None:
                return {
                    "success": False,
                    "message": "No se detectó ningún rostro",
                    "face_detected": False
                }
            
            if not self.trained:
                x, y, w, h = coords
                return {
                    "success": False,
                    "message": "El modelo no está entrenado. Registre trabajadores primero.",
                    "face_detected": True,
                    "coords": [int(x), int(y), int(w), int(h)]
                }
            
            label, confidence = self.recognizer.predict(face_roi)
            
            x, y, w, h = coords
            
            if confidence < 70:
                worker_name = self.names[label]
                recognized = True
                message = "Trabajador reconocido"
                color = (0, 255, 0)
            else:
                worker_name = "Desconocido"
                recognized = False
                message = "Trabajador no reconocido"
                color = (0, 0, 255)
            
            cv2.rectangle(img, (x, y), (x + w, y + h), color, 2)
            cv2.putText(img, f"{worker_name} ({confidence:.1f})", 
                       (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 
                       0.9, color, 2)
            
            annotated_image = self.image_to_base64(img)
            
            return {
                "success": True,
                "recognized": recognized,
                "worker_name": worker_name,
                "confidence": float(confidence),
                "message": message,
                "face_detected": True,
                "coords": [int(x), int(y), int(w), int(h)],
                "annotated_image": annotated_image
            }
            
        except Exception as e:
            print(f"[ERROR] Error en reconocimiento: {str(e)}")
            return {
                "success": False,
                "message": f"Error: {str(e)}",
                "face_detected": False
            }
    
    def register_worker(self, base64_image, worker_name):
        """Registra nuevo trabajador en el dataset"""
        try:
            img = self.base64_to_image(base64_image)
            coords, face_roi, gray = self.detect_face(img)
            
            if coords is None:
                return {
                    "success": False,
                    "message": "No se detectó ningún rostro para registrar"
                }
            
            clean_name = worker_name.replace(" ", "_")
            filename = f"{clean_name}.jpg"
            filepath = os.path.join(self.dataset_dir, filename)
            
            cv2.imwrite(filepath, img)
            
            self.load_and_train()
            
            return {
                "success": True,
                "message": f"Trabajador '{worker_name}' registrado exitosamente",
                "filename": filename
            }
            
        except Exception as e:
            print(f"[ERROR] Error al registrar: {str(e)}")
            return {
                "success": False,
                "message": f"Error al registrar: {str(e)}"
            }
    
    def get_registered_workers(self):
        """Retorna lista de trabajadores registrados"""
        workers = []
        for label_id, name in self.names.items():
            workers.append({
                "id": label_id,
                "name": name
            })
        return workers
    
    def delete_worker(self, worker_name):
        """Elimina trabajador del dataset y re-entrena el modelo"""
        try:
            clean_name = worker_name.replace(" ", "_")
            filename = f"{clean_name}.jpg"
            
            filename = os.path.basename(filename)
            
            if ".." in filename or "/" in filename or "\\" in filename:
                return {
                    "success": False,
                    "message": "Nombre de trabajador inválido"
                }
            
            filepath = os.path.join(self.dataset_dir, filename)
            
            abs_filepath = os.path.abspath(filepath)
            abs_dataset_dir = os.path.abspath(self.dataset_dir)
            
            if not abs_filepath.startswith(abs_dataset_dir):
                return {
                    "success": False,
                    "message": "Ruta de archivo inválida"
                }
            
            if not os.path.exists(filepath):
                return {
                    "success": False,
                    "message": f"No se encontró el archivo del trabajador '{worker_name}'"
                }
            
            os.remove(filepath)
            
            self.load_and_train()
            
            return {
                "success": True,
                "message": f"Trabajador '{worker_name}' eliminado exitosamente"
            }
            
        except Exception as e:
            print(f"[ERROR] Error al eliminar trabajador: {str(e)}")
            return {
                "success": False,
                "message": f"Error al eliminar trabajador: {str(e)}"
            }
