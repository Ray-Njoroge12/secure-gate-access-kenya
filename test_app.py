from fastapi import FastAPI
from backend.app.routers import visitors

app = FastAPI(title='Test App', version='1.0.0')
app.include_router(visitors.router, prefix='/api')

print('Simple app created successfully')
