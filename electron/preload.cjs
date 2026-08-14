const { contextBridge, ipcRenderer } = require('electron');
async function invoke(channel,payload){ const res=await ipcRenderer.invoke(channel,payload); if(!res.ok) throw new Error(res.error); return res.data; }
contextBridge.exposeInMainWorld('desktopStorage',{ invoke:(method,entity,...args)=>invoke('storage:invoke',{method,entity,args}) });
contextBridge.exposeInMainWorld('desktopAuth',{ invoke:(method,...args)=>invoke('auth:invoke',{method,args}) });
contextBridge.exposeInMainWorld('desktopApp',{ getDataPath:()=>invoke('app:invoke',{method:'getDataPath'}), openDataFolder:()=>invoke('app:invoke',{method:'openDataFolder'}), openBackupFolder:()=>invoke('app:invoke',{method:'openBackupFolder'}), print:()=>invoke('app:invoke',{method:'print'}) });
contextBridge.exposeInMainWorld('backup',{ create:()=>invoke('backup:invoke',{method:'create'}), list:()=>invoke('backup:invoke',{method:'list'}), restore:(name)=>invoke('backup:invoke',{method:'restore',args:[name]}), export:()=>invoke('backup:invoke',{method:'export'}), import:()=>invoke('backup:invoke',{method:'import'}) });
