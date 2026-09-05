import {list} from '../../../src/controllers/index.js';
import {requireAuth} from '../../../src/middleware/auth.js';
import {requireAdmin} from '../../../src/middleware/admin.js';
import {asyncHandler} from '../../../src/utils/errors.js';
export default asyncHandler(async(req,res)=>{await requireAuth(req,res,()=>{});
await requireAdmin(req,res,()=>{});
return list('products')(req,res)})
