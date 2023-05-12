from flask import Flask, render_template
import sqlite3
import re

app = Flask(__name__)
DATABASE = 'db/transfers.db'

def get_db():
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

@app.route('/')
def index():
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM courses_data WHERE courseName != '' ORDER BY SUBSTR(courseName, 1, 3), courseName")
    courses = cursor.fetchall()
    db.close()

    grouped_courses = {}
    for course in courses:
        prefix = re.search(r'^[A-Za-z]+', course['courseName']).group()
        course_name = course['courseName']
        if course_name.endswith('ELE'):
            prefix = prefix.rstrip('ELE')
        if prefix in grouped_courses:
            if course_name in grouped_courses[prefix]:
                grouped_courses[prefix][course_name].append(course)
            else:
                grouped_courses[prefix][course_name] = [course]
        else:
            grouped_courses[prefix] = {course_name: [course]}

    return render_template('index.html', grouped_courses=grouped_courses)


if __name__ == '__main__':
    app.run(debug=True)
