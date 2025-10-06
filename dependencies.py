"""
依存関数

FastAPIの依存関数（Dependency Injection）を定義
認証が必要なエンドポイントで使用
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from auth import verify_token
from models import User

# HTTPBearer認証スキーム
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    現在のユーザーを取得
    
    Args:
        credentials: 認証情報
        db: データベースセッション
        
    Returns:
        User: 現在のユーザー
        
    Raises:
        HTTPException: 認証に失敗した場合
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # トークンからユーザー名を取得
        username = verify_token(credentials.credentials)
        if username is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    
    # データベースからユーザーを取得
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    現在のアクティブユーザーを取得
    
    Args:
        current_user: 現在のユーザー
        
    Returns:
        User: アクティブなユーザー
        
    Raises:
        HTTPException: ユーザーが無効化されている場合
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_customer(current_user: User = Depends(get_current_active_user)) -> User:
    """
    現在のお客様ユーザーを取得
    
    Args:
        current_user: 現在のユーザー
        
    Returns:
        User: お客様ユーザー
        
    Raises:
        HTTPException: お客様権限がない場合
    """
    if current_user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer access required"
        )
    return current_user


def get_current_store_user(current_user: User = Depends(get_current_active_user)) -> User:
    """
    現在の店舗ユーザーを取得
    
    Args:
        current_user: 現在のユーザー
        
    Returns:
        User: 店舗ユーザー
        
    Raises:
        HTTPException: 店舗権限がない場合
    """
    if current_user.role != "store":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Store access required"
        )
    return current_user