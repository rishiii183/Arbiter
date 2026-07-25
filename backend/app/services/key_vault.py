from cryptography.fernet import Fernet


def encrypt_api_key(plaintext_key: str, master_key: str) -> str:
    f = Fernet(master_key.encode() if isinstance(master_key, str) else master_key)
    encrypted = f.encrypt(plaintext_key.encode()).decode("utf-8")
    del plaintext_key
    return encrypted


def decrypt_api_key(encrypted_key: str, master_key: str) -> str:
    try:
        f = Fernet(master_key.encode() if isinstance(master_key, str) else master_key)
        return f.decrypt(encrypted_key.encode()).decode("utf-8")
    except Exception:
        raise ValueError("Key decryption failed")