import Document from './Document.model.js';
import Folder from './Folder.model.js';
import User from './User.model.js';

Document.belongsTo(Folder, { foreignKey: 'folderId', as: 'folder' });
Folder.hasMany(Document, { foreignKey: 'folderId', as: 'documents' });

export { Document, Folder, User }; 