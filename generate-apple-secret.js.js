import jwt from 'jsonwebtoken';
import fs from 'fs';

const privateKey = fs.readFileSync('./AuthKey_8CPZ9XLL5F.p8');

const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d',
  audience: 'https://appleid.apple.com',
  issuer: 'D595N9X2AW',
  subject: 'com.aatmamilan.web',
  keyid: '8CPZ9XLL5F',
});

console.log('\nAPPLE CLIENT SECRET:\n');
console.log(token);