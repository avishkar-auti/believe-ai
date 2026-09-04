"""Shared FastAPI dependencies for the route layer."""

from __future__ import annotations

from typing import Annotated

from bson import ObjectId
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from core.config import Settings, get_settings
from core.db import get_database
from core.security import (
    optional_mongo_user_id,
    require_mongo_user_id,
    require_user_id,
    require_user_name,
)

SettingsDep = Annotated[Settings, Depends(get_settings)]
UserIdDep = Annotated[str, Depends(require_user_id)]
MongoUserIdDep = Annotated[ObjectId, Depends(require_mongo_user_id)]
OptionalMongoUserIdDep = Annotated[ObjectId | None, Depends(optional_mongo_user_id)]
UserNameDep = Annotated[str, Depends(require_user_name)]
DbDep = Annotated[AsyncIOMotorDatabase, Depends(get_database)]
