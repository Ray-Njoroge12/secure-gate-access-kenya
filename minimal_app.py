from fastapi import FastAPI
from backend.app.routers import visitors

app = FastAPI(
    title='Minimal Secure Gate Backend',
    version='1.0.0',
    description='Minimal version for testing'
)

# Only include one router to test
app.include_router(visitors.router, prefix='/api')

print('Minimal app created successfully')
