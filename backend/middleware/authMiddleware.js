const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const protect = async (req,res,next) => {
  const header=req.headers.authorization;
  if(!header?.startsWith('Bearer ')) return res.status(401).json({message:'Not authorized, no token provided'});
  try { const decoded=jwt.verify(header.slice(7),process.env.JWT_SECRET); const result=await pool.query('SELECT id,name,email,role FROM users WHERE id=$1',[decoded.id]); if(!result.rows.length)return res.status(401).json({message:'Not authorized, user not found'}); req.user={...result.rows[0],_id:result.rows[0].id}; return next(); } catch(error){return res.status(401).json({message:'Not authorized, token invalid or expired'});}
};
const authorize=(...roles)=>(req,res,next)=>{if(!req.user)return res.status(401).json({message:'Not authorized'});if(req.user.role==='commander'||roles.includes(req.user.role))return next();return res.status(403).json({message:'Not authorized for this resource'});};
const enforceCadetOwnership=(req,res,next)=>{if(req.user.role!=='cadet')return next();const requested=req.params.cadetId||req.params.id;if(requested&&String(requested)!==String(req.user.id))return res.status(403).json({message:'Cadets may access only their own records'});return next();};
module.exports={protect,authorize,enforceCadetOwnership};
