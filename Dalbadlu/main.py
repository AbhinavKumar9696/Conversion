# from pdf2docx import Converter
import requests

url = 'https://httpbin.org/post'
files = {'file': open('file.txt', 'rb')}  # Specify the file you want to upload

response = requests.post(url, files=files)

print(response.text)