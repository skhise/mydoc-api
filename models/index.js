import Document from './Document.model.js';
import Folder from './Folder.model.js';
import User from './User.model.js';
import Project from './Project.model.js';
import Expense from './Expense.model.js';
import ExpenseNotificationSettings from './ExpenseNotificationSettings.model.js';

Document.belongsTo(Folder, { foreignKey: 'folderId', as: 'folder' });
Folder.hasMany(Document, { foreignKey: 'folderId', as: 'documents' });

Project.hasMany(Expense, { foreignKey: 'projectId', as: 'expenses' });
Expense.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Expense.belongsTo(User, { foreignKey: 'paidBy', as: 'paidByUser' });

ExpenseNotificationSettings.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(ExpenseNotificationSettings, { foreignKey: 'userId', as: 'expenseNotificationSettings' });

export { Document, Folder, User, Project, Expense, ExpenseNotificationSettings }; 