from flask import Flask, jsonify, request
from flask_login import login_user, logout_user, login_required, current_user
from config import Config
# REMOVED 'cors' FROM THIS IMPORT
from extensions import db, migrate, login_manager, bcrypt
from models import User, Meeting 
from datetime import datetime, time, timedelta
import pytz

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions (NO CORS HERE)
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    bcrypt.init_app(app)

    with app.app_context():
        # --- ALL YOUR ROUTES REMAIN THE SAME, STARTING HERE ---
        
        @app.route('/api/register', methods=['POST'])
        def register():
            data = request.get_json()
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')

            if User.query.filter_by(email=email).first():
                return jsonify({'message': 'Email already registered'}), 409

            if User.query.filter_by(username=username).first():
                return jsonify({'message': 'Username already taken'}), 409
            
            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
            new_user = User(username=username, email=email, password_hash=hashed_password)
            db.session.add(new_user)
            db.session.commit()
            
            return jsonify({'message': 'User registered successfully'}), 201

        @app.route('/api/login', methods=['POST'])
        def login():
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')
            user = User.query.filter_by(email=email).first()

            if user and bcrypt.check_password_hash(user.password_hash, password):
                login_user(user, remember=True)
                return jsonify({
                    'message': 'Login successful',
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'timezone': user.timezone,
                        'working_hours_start': user.working_hours_start.strftime('%H:%M'),
                        'working_hours_end': user.working_hours_end.strftime('%H:%M')
                    }
                }), 200
            
            return jsonify({'message': 'Invalid email or password'}), 401
        
        @app.route('/api/logout', methods=['POST'])
        @login_required
        def logout():
            logout_user()
            return jsonify({'message': 'Logout successful'}), 200

        @app.route('/api/profile', methods=['GET'])
        @login_required
        def profile():
            return jsonify({
                'id': current_user.id,
                'username': current_user.username,
                'email': current_user.email,
                'timezone': current_user.timezone,
                'working_hours_start': current_user.working_hours_start.strftime('%H:%M'),
                'working_hours_end': current_user.working_hours_end.strftime('%H:%M')
            })

        @app.route('/api/profile', methods=['PUT'])
        @login_required
        def update_profile():
            data = request.get_json()
            user = current_user

            if 'username' in data:
                user.username = data['username']
            if 'timezone' in data:
                user.timezone = data['timezone']
            if 'working_hours_start' in data:
                user.working_hours_start = datetime.strptime(data['working_hours_start'], '%H:%M').time()
            if 'working_hours_end' in data:
                user.working_hours_end = datetime.strptime(data['working_hours_end'], '%H:%M').time()

            db.session.commit()

            return jsonify({
                'message': 'Profile updated successfully',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'timezone': user.timezone,
                    'working_hours_start': user.working_hours_start.strftime('%H:%M'),
                    'working_hours_end': user.working_hours_end.strftime('%H:%M')
                }
            })

        @app.route('/api/check_session')
        def check_session():
            if current_user.is_authenticated:
                return jsonify({
                    'logged_in': True,
                    'user': {
                        'id': current_user.id,
                        'username': current_user.username,
                        'email': current_user.email,
                        'timezone': current_user.timezone,
                        'working_hours_start': current_user.working_hours_start.strftime('%H:%M'),
                        'working_hours_end': current_user.working_hours_end.strftime('%H:%M')
                    }
                })
            return jsonify({'logged_in': False}), 401
        
        @app.route('/api/timezones', methods=['GET'])
        def get_all_timezones():
            return jsonify(pytz.all_timezones)

        @app.route('/api/users', methods=['GET'])
        @login_required
        def get_users():
            users = User.query.all()
            user_list = [{'id': user.id, 'username': user.username} for user in users if user.id != current_user.id]
            return jsonify(user_list)

        @app.route('/api/meetings', methods=['GET'])
        @login_required
        def get_meetings():
            meetings = current_user.meetings.all()
            meeting_list = []
            for meeting in meetings:
                meeting_list.append({
                    'id': meeting.id,
                    'title': meeting.title,
                    'start': meeting.start_time.isoformat(),
                    'end': meeting.end_time.isoformat()
                })
            return jsonify(meeting_list)

        @app.route('/api/meetings/upcoming', methods=['GET'])
        @login_required
        def get_upcoming_meetings():
            now_utc = datetime.utcnow().replace(tzinfo=pytz.utc)
            upcoming = current_user.meetings.filter(Meeting.end_time > now_utc).order_by(Meeting.start_time.asc()).limit(5).all()
            meeting_list = []
            for meeting in upcoming:
                meeting_list.append({
                    'id': meeting.id,
                    'title': meeting.title,
                    'start': meeting.start_time.isoformat(),
                    'end': meeting.end_time.isoformat()
                })
            return jsonify(meeting_list)
        
        @app.route('/api/meetings/<int:meeting_id>', methods=['DELETE'])
        @login_required
        def delete_meeting(meeting_id):
            meeting = Meeting.query.get_or_404(meeting_id)
            # Security check: only the owner of the meeting can delete it
            if meeting.owner_id != current_user.id:
                return jsonify({'message': 'Unauthorized'}), 403
            db.session.delete(meeting)
            db.session.commit()
            return jsonify({'message': 'Meeting deleted successfully'}), 200

        @app.route('/api/meetings', methods=['POST'])
        @login_required
        def create_meeting():
            data = request.get_json()
            title = data.get('title')
            start_str = data.get('start')
            end_str = data.get('end')
            participant_ids = data.get('participant_ids', [])

            if not all([title, start_str, end_str]):
                return jsonify({'message': 'Missing required fields'}), 400

            start_time = datetime.fromisoformat(start_str.replace('Z', '+00:00'))
            end_time = datetime.fromisoformat(end_str.replace('Z', '+00:00'))

            new_meeting = Meeting(title=title, start_time=start_time, end_time=end_time, owner_id=current_user.id)
            
            new_meeting.participants.append(current_user)

            for user_id in participant_ids:
                user = User.query.get(int(user_id))
                if user and user not in new_meeting.participants:
                    new_meeting.participants.append(user)

            db.session.add(new_meeting)
            db.session.commit()
            return jsonify({'message': 'Meeting created successfully'}), 201

        @app.route('/api/suggest-times', methods=['POST'])
        @login_required
        def suggest_times():
            data = request.get_json()
            participant_ids_str = data.get('participant_ids', [])
            participant_ids = [int(pid) for pid in participant_ids_str]
            meeting_date_str = data.get('date')
            duration_minutes = int(data.get('duration', 60))

            all_participant_ids = list(set(participant_ids + [current_user.id]))
            participants = User.query.filter(User.id.in_(all_participant_ids)).all()
            
            meeting_date = datetime.strptime(meeting_date_str, '%Y-%m-%d').date()
            
            slots = []
            day_start = datetime.combine(meeting_date, time(0, 0), tzinfo=pytz.utc)
            for i in range(48):
                slot_start = day_start + timedelta(minutes=30 * i)
                slots.append(slot_start)

            available_slots = []
            for slot_start_utc in slots:
                slot_end_utc = slot_start_utc + timedelta(minutes=duration_minutes)
                is_available_for_all = True

                for user in participants:
                    user_tz = pytz.timezone(user.timezone or 'UTC')
                    slot_start_local = slot_start_utc.astimezone(user_tz)
                    
                    if not (user.working_hours_start <= slot_start_local.time() < user.working_hours_end):
                        is_available_for_all = False
                        break
                    
                    conflicts = user.meetings.filter(
                        (Meeting.start_time < slot_end_utc) & (Meeting.end_time > slot_start_utc)
                    ).count()

                    if conflicts > 0:
                        is_available_for_all = False
                        break
                
                if is_available_for_all:
                    available_slots.append(slot_start_utc.isoformat())

            return jsonify(available_slots[:5])

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
