"""Authentication routes."""

from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.auth.jwt import create_access_token
from app.db.models import User, Organization, UserRole
from app.db.session import AsyncSessionLocal

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"])


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    org_name: str
    email: str
    password: str = Field(..., min_length=8)


@router.post("/login")
async def login(req: LoginRequest):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == req.email))
        user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not pwd_context.verify(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.org_id, user.id, user.role.value)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/register")
async def register(req: RegisterRequest):
    async with AsyncSessionLocal() as session:
        # 1. Check if user already exists
        result = await session.execute(select(User).where(User.email == req.email))
        existing_user = result.scalar_one_or_none()
        if existing_user is not None:
            raise HTTPException(status_code=409, detail="Email already registered")

        # 2. Create Organization
        org = Organization(name=req.org_name)
        session.add(org)
        await session.flush()

        # 3. Hash password
        hashed_pw = pwd_context.hash(req.password)

        # 4. Create User as OWNER
        user = User(
            org_id=org.id,
            email=req.email,
            hashed_password=hashed_pw,
            role=UserRole.OWNER,
        )
        session.add(user)
        await session.commit()

        user_id = str(user.id)
        org_id = str(org.id)

    return {
        "status": "registered",
        "user_id": user_id,
        "org_id": org_id,
    }
