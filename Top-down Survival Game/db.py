import sys, os, sqlite3

DATABASE = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'app.db')

from flask import Flask, g
app = Flask(__name__)

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
    return g.db

@app.teardown_appcontext
def close_db(exception=None):
    db = g.pop('db', None)

    if db is not None:
        db.close()