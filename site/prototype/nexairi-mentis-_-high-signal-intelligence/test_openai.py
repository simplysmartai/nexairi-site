import os
from openai import OpenAI

print("OPENAI_API_KEY present?", bool(os.environ.get("OPENAI_API_KEY")))
print("OPENAI_MODEL:", os.environ.get("OPENAI_MODEL"))

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

try:
    resp = client.models.list()
    print("OK: listed", len(resp.data), "models")
except Exception as e:
    print("ERROR:", repr(e))
