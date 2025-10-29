
async function RegisterUser(req,res) {
    const {registerUser}=require('../models/authModel.js');
    const {boleta, nombre, apellido, correo, password} = req.body;
    const result = await registerUser({ boleta, nombre, apellido, correo, password });
    if (result.error) {
        return res.status(400).json({ error: result.error.message });
    }
    return res.status(201).json({ user: result.data });
}

async function LoginUser(req,res) {
const { loginUser } =  require('../models/authModel.js');

    const { correo, password } = req.body;
    const result = await loginUser({ correo, password });
    if (result.error) {
        return res.status(400).json({ error: result.error.message });
    }
    return res.status(200).json({ user: result.data });
}


module.exports = { RegisterUser, LoginUser };