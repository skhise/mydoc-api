import Reminder from "../models/Reminder.model.js";

export const registerReminder = async (req, res) => {
    try {
        const { name, date,time,description,created_by } = req.body;
        const reminder = await Reminder.create({ name, date,time,description,created_by });
        res.status(201).json(reminder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const listReminders = async(req,res) =>{
    try {
        const users = Reminder.findAll();
        res.status(200).json(users);
    }catch(error){
        res.status(500).json({ error: error.message });
    }
}

