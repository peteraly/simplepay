import net from 'net';

export async function findAvailablePort(startPort: number = 3000): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address() as net.AddressInfo;
      server.close(() => {
        resolve(port.port);
      });
    });
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        findAvailablePort(startPort + 1)
          .then(resolve)
          .catch(reject);
      } else {
        reject(err);
      }
    });
  });
} 