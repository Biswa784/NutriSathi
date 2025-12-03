from fastapi import APIRouter, HTTPException
from app.crud.crud_items import create_item, get_item, get_items, update_item, delete_item
from app.schemas.item import ItemCreate, ItemRead, ItemUpdate

router = APIRouter()

@router.post("/items/", response_model=ItemRead)
async def create_item_endpoint(item: ItemCreate):
    db_item = await create_item(item)
    return db_item

@router.get("/items/{item_id}", response_model=ItemRead)
async def read_item_endpoint(item_id: int):
    db_item = await get_item(item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item

@router.get("/items/", response_model=list[ItemRead])
async def read_items_endpoint(skip: int = 0, limit: int = 10):
    items = await get_items(skip=skip, limit=limit)
    return items

@router.put("/items/{item_id}", response_model=ItemRead)
async def update_item_endpoint(item_id: int, item: ItemUpdate):
    db_item = await update_item(item_id, item)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item

@router.delete("/items/{item_id}", response_model=ItemRead)
async def delete_item_endpoint(item_id: int):
    db_item = await delete_item(item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item