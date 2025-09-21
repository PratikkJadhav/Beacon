const peers = (rfinfo)=>{
    const knownPeers = new Map()
    knownPeers.set(rfinfo.username ,{address : rfinfo.address , port: rfinfo.port , Activestatus:rfinfo.Activestatus})
    return knownPeers;
}

export default peers