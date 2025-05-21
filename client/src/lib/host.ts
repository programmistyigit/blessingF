// API serverning host manzili
export const baseHost = process.env.NODE_ENV === 'production' 
  ? window.location.origin  // Production muhitida aynan shu sayt manzilidan olinadi
  : "http://localhost:8000"; // Development muhitida local server