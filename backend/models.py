from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class Role(db.Model):
    __tablename__ = 'roles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(200))
    permissions = db.Column(db.JSON, default={})
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    users = db.relationship('User', backref='role', lazy=True)
    
    def __repr__(self):
        return f'<Role {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'permissions': self.permissions,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(200))
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def to_dict(self, include_sensitive=False):
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role.to_dict() if self.role else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
        if include_sensitive:
            data['password_hash'] = self.password_hash
        return data


class Worker(db.Model):
    __tablename__ = 'workers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), unique=True, nullable=False)
    photo_path = db.Column(db.String(500), nullable=False)
    registered_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    registered_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    is_active = db.Column(db.Boolean, default=True)
    
    registrar = db.relationship('User', foreign_keys=[registered_by])
    
    def __repr__(self):
        return f'<Worker {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'photo_path': self.photo_path,
            'registered_at': self.registered_at.isoformat() if self.registered_at else None,
            'registered_by': self.registrar.username if self.registrar else None,
            'is_active': self.is_active
        }


class AttendanceSync(db.Model):
    __tablename__ = 'attendance_sync'
    
    id = db.Column(db.Integer, primary_key=True)
    worker_id = db.Column(db.String(100), nullable=False)
    worker_name = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(10), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    confidence = db.Column(db.Float)
    synced_at = db.Column(db.DateTime, default=datetime.utcnow)
    client_id = db.Column(db.String(100))
    
    def __repr__(self):
        return f'<AttendanceSync {self.worker_name} - {self.type}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'worker_id': self.worker_id,
            'worker_name': self.worker_name,
            'type': self.type,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'confidence': self.confidence,
            'synced_at': self.synced_at.isoformat() if self.synced_at else None,
            'client_id': self.client_id
        }


class SyncApproval(db.Model):
    __tablename__ = 'sync_approvals'
    
    id = db.Column(db.Integer, primary_key=True)
    requested_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    requested_at = db.Column(db.DateTime, default=datetime.utcnow)
    approved_at = db.Column(db.DateTime)
    expires_at = db.Column(db.DateTime)
    records_count = db.Column(db.Integer, default=0)  # Cantidad de registros a sincronizar
    records_summary = db.Column(db.Text)  # JSON con resumen de registros
    
    requester = db.relationship('User', foreign_keys=[requested_by])
    approver = db.relationship('User', foreign_keys=[approved_by])
    
    def __repr__(self):
        return f'<SyncApproval {self.id} - {self.status}>'
    
    def to_dict(self):
        import json
        return {
            'id': self.id,
            'requested_by': self.requested_by,
            'approved_by': self.approved_by,
            'status': self.status,
            'requested_at': self.requested_at.isoformat() if self.requested_at else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'requester': self.requester.username if self.requester else None,
            'approver': self.approver.username if self.approver else None,
            'records_count': self.records_count,
            'records_summary': json.loads(self.records_summary) if self.records_summary else None
        }
