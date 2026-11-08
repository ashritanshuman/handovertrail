from typing import List, TypeVar, Any

T = TypeVar("T")


def filter_entities_by_clearance(entities: List[T], user_clearance: int) -> List[T]:
    """
    Enforces server-side clearance boundaries:
    Entities with access_level > user_clearance are excluded.
    """
    allowed = []
    for item in entities:
        level = getattr(item, "access_level", 1)
        if isinstance(item, dict):
            level = item.get("access_level", 1)
        if level <= user_clearance:
            allowed.append(item)
    return allowed


def can_view_entity(entity_access_level: int, user_clearance: int) -> bool:
    return entity_access_level <= user_clearance

