import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'library-management-secret-key'
    DEBUG = True
    
class DevelopmentConfig(Config):
    DEBUG = True
    
class ProductionConfig(Config):
    DEBUG = False
    
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}