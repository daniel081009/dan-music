from flask import request, send_file
from flask import Flask, send_file
import re
from flask import Flask,  request, send_file
from flask_cors import CORS
from threading import Thread
import yt_dlp
import os
import random
import string

downloadlist = []


def download_mp3_playlist(playlist_url, destination_path):
    downloadlist.append(playlist_url)
    ydl_opts = {
        'ignoreerrors': True,
        'WriteThumbnail': True,
        'download_archive': destination_path + '/already_downloaded_tracks.txt',
        'format': 'bestaudio/best',
        'outtmpl': destination_path + '%(id)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '320',
        },
            {'key': 'FFmpegMetadata'},
        ],
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([playlist_url])
    except Exception as e:
        print(e)
    downloadlist.remove(playlist_url)


app = Flask(__name__)

cors = CORS(app, resources={r"*": {"origins": "*"}})


@app.after_request
def after_request(response):
    response.headers.add('Accept-Ranges', 'bytes')
    return response


host = "http://localhost/"


@app.route('/downloadlist', methods=['GET'])
def list():
    return {
        "list": downloadlist,
    }


def RandomString(stringLength=10):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(stringLength))


@app.route('/mp3upload', methods=['POST'])
def file_upload():
    f = request.files['files']
    filename = RandomString()+"_"+f.filename

    f.save(os.path.join("mp3", filename))
    return host+"file/" + filename


@app.route('/mp3/watch', methods=['GET'])
def username_route():
    if request.args.to_dict()['v'] is None:
        return "No video id"
    if os.path.exists("./mp3/" + request.args.to_dict()['v'] + ".mp3"):
        return host + "file/" + request.args.to_dict()['v'] + ".mp3"
    thread = Thread(target=download_mp3_playlist,
                    args=("https://youtube.com/watch?v=" + request.args.to_dict()['v'], "./mp3/"))
    thread.daemon = True
    thread.start()
    return host + "file/" + request.args.to_dict()['v'] + ".mp3"


def video_id(value):
    reg = re.compile(
        r'((?<=(v|V)/)|(?<=be/)|(?<=(\?|\&)v=)|(?<=embed/))([\w-]+)')
    value = reg.search(value)
    return value.group() if value else None


nolist = []


@app.route('/<path:filename>')
def download_file(filename):
    if not os.path.exists("./mp3/" + filename) and filename not in nolist and filename.split(".")[1] == "mp3":
        nolist.append(filename)
        print("File not found, downloading", filename.split(".")[0])
        thread = Thread(target=download_mp3_playlist,
                        args=("https://youtube.com/watch?v=" + filename.split(".")[0], "./mp3/"))
        thread.daemon = True
        thread.start()

    return send_file(path_or_file='mp3/'+filename, as_attachment=True)

# def send_file_partial(path):
#     headers = {'Content-Length': os.path.getsize("mp3/"+path)}
#     file_obj = BytesIO()
#     file_obj.write(open("./mp3/"+path, 'rb').read())
#     file_obj.seek(0)
#     return Response(file_obj, headers=headers)


if __name__ == '__main__':
    app.run(host="127.0.0.1", port='5001')
