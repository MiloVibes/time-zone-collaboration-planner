from flask_login import UserMixin
from extensions import db, login_manager
from datetime import time

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# This is the association table for the many-to-many relationship
meeting_participants = db.Table('meeting_participants',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('meeting_id', db.Integer, db.ForeignKey('meeting.id'), primary_key=True)
)

# This is the SINGLE, correct definition for the User model
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    timezone = db.Column(db.String(100), nullable=False, default='UTC')
    
    # The new fields are included here
    working_hours_start = db.Column(db.Time, nullable=False, default=time(9, 0))
    working_hours_end = db.Column(db.Time, nullable=False, default=time(17, 0))

    def __repr__(self):
        return f'<User {self.username}>'

# This is the definition for the Meeting model
class Meeting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    participants = db.relationship('User', secondary=meeting_participants,
        backref=db.backref('meetings', lazy='dynamic'), lazy='dynamic')

    def __repr__(self):
        return f'<Meeting {self.title}>'