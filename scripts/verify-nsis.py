"""Check the installer length and CRC using NSIS' on-launch integrity rules."""
import pathlib,struct,sys,zlib
p=pathlib.Path(sys.argv[1]);data=p.read_bytes()
assert data[:2]==b'MZ','Missing Windows executable header'
sig=b'\xef\xbe\xad\xdeNullsoftInst'
pos=data.find(sig)-4
assert pos>=512 and pos%512==0,'Missing aligned NSIS header'
flags,_,_,_,_,header_length,following=struct.unpack_from('<7I',data,pos)
end=pos+following
assert end==len(data),f'Incomplete NSIS installer: header expects {end} bytes, found {len(data)}'
assert flags==0,'Unexpected NSIS flags: CRC must be enabled'
expected=struct.unpack_from('<I',data,end-4)[0]
actual=zlib.crc32(data[512:end-4])&0xffffffff
assert actual==expected,f'NSIS integrity CRC mismatch: {actual:08x} != {expected:08x}'
print(f'PASS NSIS header length and launch CRC: {len(data)} bytes, CRC {actual:08x}')
