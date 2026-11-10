// Generate an ADMIN_PASSWORD_HASH value (salted PBKDF2-SHA256, 100k iterations).
//   npm run hash-password
// The password is read from the terminal without being echoed or saved.
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import readline from 'node:readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
rl._writeToOutput = (text) => {
    if (text.includes('password')) process.stdout.write(text);
};

rl.question('New admin password (min 12 characters): ', (password) => {
    rl.close();
    process.stdout.write('\n');
    if (password.length < 12) {
        console.error('Please use at least 12 characters.');
        process.exit(1);
    }
    const salt = randomBytes(16);
    const hash = pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    console.log('Set this as the ADMIN_PASSWORD_HASH secret in Cloudflare Pages:\n');
    console.log(`pbkdf2$100000$${salt.toString('hex')}$${hash.toString('hex')}`);
});
