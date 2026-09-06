import sys
from loguru import logger


def setup_logging(debug: bool = True):
    logger.remove()
    level = "DEBUG" if debug else "INFO"
    logger.add(
        sys.stderr,
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan> - <level>{message}</level>",
        level=level,
        colorize=True,
    )
    logger.add(
        "logs/agent.log",
        rotation="10 MB",
        retention="7 days",
        level="INFO",
        encoding="utf-8",
    )
    return logger
