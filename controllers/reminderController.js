import Reminder from "../models/Reminder.model.js";

export const createReminder = async (req, res) => {
    try {
        const { name, date,time,description,created_by,is_repeated=false,days_before=0, } = req.body;
        if (!name || !date || !time || !description) {
            return res.status(400).json({
                error: "All fields are required: name, date, time, description."
            });
        }
        const reminder = await Reminder.create({ name, date,time,description,created_by,is_repeated,days_before });
        res.status(201).json(reminder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllReminder = async(req,res) =>{
    try {
        const reminders = await Reminder.findAll();
        res.status(200).json({
            success: true,
            message: "reminders fetched successfully",
            reminders
        });
    }catch(error){
        res.status(500).json({ error: error.message });
    }
}


export const getReminderByUserID = async (req, res) => {
    try {
      const { created_by } = req.params;
  
      if (!created_by) {
        return res.status(400).json({ error: 'Missing created_by' });
      }
  
      const reminders = await Reminder.findAll({
        where: { created_by },
      });
  
      res.status(200).json({
        success: true,
        message: "Reminders fetched successfully",
        reminders,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
 

export const getReminderByReminderID = async(req,res) =>{
    try {
        const { id } = req.params; 
        if (!id) {
            return res.status(400).json({ error: 'Missing ID' });
        }
      
        const reminders = await Reminder.findAll({
            where: { id }, 
          });        

          if (!reminders || reminders.length === 0) {
            return res.status(404).json({ error: 'Reminder not found' });
          }

          res.status(200).json({
            success: true,
            message: "reminders fetched successfully",
            reminders
        });
    }catch(error){
        res.status(500).json({ error: error.message });
    }
}

export const deleteReminderByID = async (req, res) => {
    try {
      const { id } = req.params;
  
      const reminder = await Reminder.findByPk(id);
  
      if (!reminder) {
        return res.status(404).json({ error: 'Reminder not found' });
      }
  
      await reminder.destroy();
  
      res.status(200).json({
        success: true,
        message: 'Reminder deleted successfully',
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  export const updateReminderByID = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, date,time,description,created_by } = req.body;
      
      const reminder = await Reminder.findByPk(id);
  
      if (!reminder) {
        return res.status(404).json({ error: 'Reminder not found' });
      }
  
      await reminder.update({
        name: name ?? reminder.title,
        description: description ?? reminder.description,
        date: date ?? reminder.date,
        time: time ?? reminder.time,
        created_by: created_by ?? reminder.created_by,
      });
  
      res.status(200).json({
        success: true,
        message: 'Reminder updated successfully',
        reminder,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  


 
