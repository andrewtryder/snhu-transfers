from flask import Flask, render_template
import sqlite3
import re
from collections import OrderedDict

app = Flask(__name__)
DATABASE = 'db/transfers.db'


def connect_to_database():
    """Connects to the SQLite database and returns a database object"""
    return sqlite3.connect(DATABASE)


def get_courses_data():
    """Retrieves courses data from the database"""
    with connect_to_database() as db:
        db.row_factory = sqlite3.Row
        cursor = db.cursor()
        cursor.execute(
            "SELECT * FROM courses_data JOIN transfer_classes ON courses_data.pid = transfer_classes.pid "
            "WHERE courses_data.title != '' "
            "ORDER BY courses_data.title"
        )
        return cursor.fetchall()


def group_courses_data(courses_data):
    """Groups the courses data by prefix and course name"""
    grouped_courses = OrderedDict()
    for row in courses_data:
        course = {
            'title': row['title'],
            'pid': row['pid'],
            'eligibilityTimeframe': row['eligibilityTimeframe'],
            'groupFilter2Name': row['groupFilter2Name'],
            'academicLevel': row['academicLevel'],
            'coursePID': row['coursePID'],
            'courseName': row['courseName']
        }

        prefix = re.search(r'^[A-Za-z]+', course['courseName']).group()
        course_name = course['courseName']
        if course_name.endswith('ELE'):
            prefix = prefix.rstrip('ELE')

        if prefix in grouped_courses:
            if course_name in grouped_courses[prefix]:
                grouped_courses[prefix][course_name].append(course)
            else:
                grouped_courses[prefix][course_name] = [course]
                grouped_courses[prefix][course_name].sort(key=lambda x: x['title'])  # Sort courses alphabetically
        else:
            grouped_courses[prefix] = OrderedDict()
            grouped_courses[prefix][course_name] = [course]

    # Sort prefixes alphabetically
    return OrderedDict(sorted(grouped_courses.items()))

@app.route('/')
def index():
    """Renders the index page with grouped courses data"""
    courses_data = get_courses_data()
    grouped_courses = group_courses_data(courses_data)
    return render_template('index.html', grouped_courses=grouped_courses)

if __name__ == '__main__':
    app.run(debug=True)
