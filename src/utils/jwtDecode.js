import jwt_decode from 'jwt-decode';

function getDecodedToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const decoded = jwt_decode(token);
    return decoded;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
}
