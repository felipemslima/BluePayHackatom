from nacl.signing import SigningKey
from nacl.encoding import Base64Encoder

sk = SigningKey.generate()
pk = sk.verify_key

print("SERVER_SK_B64=", sk.encode(encoder=Base64Encoder).decode())
print("SERVER_PK_B64=", pk.encode(encoder=Base64Encoder).decode())
