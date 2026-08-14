from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status


def parse_object_id(value: str, field_name: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except InvalidId as err:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid {field_name}") from err
