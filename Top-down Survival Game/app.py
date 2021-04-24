import os, sys, datetime
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from flask import Flask, render_template, url_for, redirect, flash, session, request
from flask_wtf import FlaskForm
from wtforms.validators import InputRequired, Length, Regexp
from wtforms.fields import StringField, PasswordField
from werkzeug.security import generate_password_hash, check_password_hash
from db import get_db

# login form
class Login(FlaskForm):
    login_username = StringField('Username', validators=[InputRequired(message="You must enter your username.")])
    login_password = PasswordField('Password', validators=[InputRequired(message="Password is required.")])

# register form
class Register(FlaskForm):
    register_username = StringField('Username', validators=[InputRequired(message="You cannot leave the username field empty."), Length(min=1, max=15, message="That username is too long."), Regexp('^\w+$', message="You cannot use spaces or special characters.")])
    register_password = PasswordField('Password', validators=[InputRequired(message="You cannot leave the password field empty."), Length(min=5, max=20, message="Your password should be 5-20 characters long.")])



app = Flask(__name__)
app.secret_key = 'key'
app.permanent_session_lifetime = datetime.timedelta(days=1)

@app.route('/')
def index():
    login_form = Login()
    register_form = Register()

    return render_template('index.html', loginForm=login_form, registerForm=register_form)

@app.route('/login', methods=['POST'])
def login():
    login_form = Login()

    if login_form.validate_on_submit():
        username = login_form.login_username.data
        password = login_form.login_password.data

        db_connection = get_db()
        db_cursor = get_db().cursor()
        full_user_data = db_cursor.execute('SELECT * FROM accounts WHERE username = ?', (username,)).fetchone()

        if full_user_data:
            verify_password = check_password_hash(full_user_data[1], password)

            if verify_password:
                session.pop('verified_username', None)
                session['verified_username'] = username
                return redirect(url_for('index'))
            else:
                flash("Invalid username or password.", 'invalidCredentials')

        else:
            flash("Invalid username or password.", 'invalidCredentials')

    else:
        if 'login_username' in login_form.errors and not('login_password' in login_form.errors):
            flash(login_form.errors['login_username'][0], 'emptyUsername')

        elif 'login_password' in login_form.errors and not('login_username' in login_form.errors):
            flash(login_form.errors['login_password'][0], 'emptyPassword')

        elif 'login_username' in login_form.errors and 'login_password' in login_form.errors:
            flash("Please fill in the fields before submitting.", 'emptyFields')

    return redirect(url_for('index'))

@app.route('/register', methods=['POST'])
def register():
    login_form = Login()
    register_form = Register()

    if register_form.validate_on_submit():
        username = register_form.register_username.data
        password = register_form.register_password.data

        db_connection = get_db()
        db_cursor = get_db().cursor()
        full_user_data = db_cursor.execute('SELECT * FROM accounts WHERE username = ?', (username,)).fetchone()

        if not(full_user_data):
            hashed_password = generate_password_hash(password)
            db_cursor.execute('INSERT INTO accounts (username, password) VALUES (?,?)', (username, hashed_password))
            db_connection.commit()
            return redirect(url_for('index'))

        else:
            flash("That username is already taken.", 'invalidUsername')

    else:
        if 'register_username' in register_form.errors and not('register_password' in register_form.errors):
            flash(register_form.errors['register_username'][0], 'emptyUsername')

        elif 'register_password' in register_form.errors and not('register_username' in register_form.errors):
            flash(register_form.errors['register_password'][0], 'emptyPassword')

        elif 'register_username' in register_form.errors and 'register_password' in register_form.errors:
            flash("Please fill in the fields before submitting.", 'emptyFields')

    return render_template('index.html', loginForm=login_form, registerForm=register_form, invalidSubmissionFlag=True)

@app.route('/logout')
def logout():
    session.pop('verified_username', None)
    return redirect(url_for('index'))

@app.route('/game')
def game():
    return render_template('game.html')

@app.route('/leaderboard', methods=['GET', 'POST'])
def leaderboard():
    db_connection = get_db()
    db_cursor = get_db().cursor()

    if request.method == 'POST':
        # all this data comes from the game
        full_player_data = request.json
        player_kill_count = full_player_data['kills']
        player_waves_survived = full_player_data['waves']
        player_seconds_lasted = full_player_data['secs']
        player_minutes_lasted = full_player_data['mins']
        player_hours_lasted = full_player_data['hrs']

        stringified_hrs = str(player_hours_lasted)
        stringified_mins = str(player_minutes_lasted)
        stringified_secs = str(player_seconds_lasted)

        if 'verified_username' in session:
            check_if_user_already_exists = db_cursor.execute('SELECT COUNT(*) FROM leaderboard WHERE username = ?', (session['verified_username'],)).fetchone()[0]

            if check_if_user_already_exists == 0:
                player_best_time = f'{stringified_hrs.zfill(2)}:{stringified_mins.zfill(2)}:{stringified_secs.zfill(2)}'

                db_cursor.execute('INSERT INTO leaderboard (username, kills, waves_survived, highest_wave, best_time) VALUES (?,?,?,?,?)', (session['verified_username'], player_kill_count, player_waves_survived, player_waves_survived, player_best_time))
                db_connection.commit()

            elif check_if_user_already_exists == 1:
                full_user_data = db_cursor.execute('SELECT * FROM leaderboard WHERE username = ?', (session['verified_username'],)).fetchone()

                new_kill_count = full_user_data[1] + player_kill_count
                new_waves_survived = full_user_data[2] + player_waves_survived
                new_highest_wave = full_user_data[3] # the database value is set as the default
                new_best_time = f'{stringified_hrs.zfill(2)}:{stringified_mins.zfill(2)}:{stringified_secs.zfill(2)}' # the default is the player's new time - this is checked below


                if player_waves_survived > new_highest_wave:
                    new_highest_wave = player_waves_survived


                hrs_mins_secs = full_user_data[4].split(':')
                digit_collection = []

                # this for loop removes any zeroes to the left of the digit since those prevent python from converting string numbers to actual integers
                for dd in hrs_mins_secs:
                    if dd[0] == '0':
                        new_digit = dd[1]
                        digit_collection.append(new_digit)
                    else:
                        digit_collection.append(dd)

                db_hrs = int(digit_collection[0])
                db_mins = int(digit_collection[1])
                db_secs = int(digit_collection[2])

                # checks whether the player's new time is better than their previous best (this means that the player has beaten their highest wave at an earlier time; however, if the player survives past their highest, this check will not fire)
                if player_waves_survived == full_user_data[3]:
                    if player_hours_lasted > db_hrs:
                        new_best_time = full_user_data[4]
                    else:
                        if player_minutes_lasted > db_mins:
                            new_best_time = full_user_data[4]
                        else:
                            if player_seconds_lasted > db_secs:
                                new_best_time = full_user_data[4]

                db_cursor.execute('UPDATE leaderboard SET kills = ?, waves_survived = ?, highest_wave = ?, best_time = ? WHERE username = ?', (new_kill_count, new_waves_survived, new_highest_wave, new_best_time, session['verified_username']))
                db_connection.commit()

    db_filter = None

    if request.args.get('filter') is not None:
        db_filter = request.args.get('filter')

    leaderboard_data = []
    check_if_data_exists = db_cursor.execute('SELECT COUNT(*) FROM leaderboard').fetchone()[0]

    if check_if_data_exists > 0:
        if db_filter is None:
            leaderboard_data = db_cursor.execute(f'SELECT * FROM leaderboard').fetchall()
        elif db_filter == 'best_time':
            leaderboard_data = db_cursor.execute('SELECT * FROM leaderboard ORDER BY highest_wave DESC, best_time ASC').fetchall()
        else:
            leaderboard_data = db_cursor.execute(f'SELECT * FROM leaderboard ORDER BY {db_filter} DESC').fetchall()

    return render_template('leaderboard.html', leaderboardData=leaderboard_data)


if __name__ == '__main__':
    app.run(debug=True)