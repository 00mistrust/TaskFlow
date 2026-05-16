const Project = require('../models/Project');
const User = require('../models/user'); 

// Récupérer tous les projets 
// Récupérer tous les projets (propriétaire OU membre)
exports.getAllProjects = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        //  On cherche les projets où on est soit owner, soit dans le tableau members 
        const condition = {
            $or: [
                { owner: req.user.id },
                { members: req.user.id }
            ]
        };
        const projects = await Project.find(condition)  
    .populate('owner', 'nom name email') 
    .populate('members', 'nom name email')
    .skip(skip)
    .limit(limit);
        const total = await Project.countDocuments(condition);

        res.json({
            data: projects,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Récupérer UN projet avec ses membres 
exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', 'nom email name')
            .populate('members', 'nom email name');
            
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json({ data: project });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Créer un projet
exports.createProject = async (req, res) => {
    try {
        const { title, description, deadline } = req.body;
        const newProject = new Project({
            title,
            description,
            deadline,
            owner: req.user.id 
        });

        await newProject.save();
        res.status(201).json(newProject);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Mettre à jour un projet
exports.updateProject = async (req, res) => {
    try {
        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.id },  
            req.body,
            { new: true }
        );
        if (!project) return res.status(404).json({ error: 'Project non trouvé' });
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Inviter un membre 
exports.inviteMember = async (req, res) => {
    try {
        const { email } = req.body; 
        const project = await Project.findById(req.params.id);

        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Seul le propriétaire peut modifier les membres' });
        }
        
        const userToAdd = await User.findOne({ email });
        if (!userToAdd) return res.status(404).json({ error: 'Aucun utilisateur trouvé avec cet email' });

        if (project.members.includes(userToAdd._id)) {
            return res.status(400).json({ error: 'User is already a member' });
        }

        project.members.push(userToAdd._id);
        await project.save();

        res.json({ message: 'Member added successfully', project });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Supprimer un membre
exports.removeMember = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
  
        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Only the owner can modify project members' });
        }

        project.members = project.members.filter(m => m.toString() !== req.params.userId);
        await project.save();

        res.json({ message: 'Member removed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// Supprimer un projet
exports.deleteProject = async (req, res) => {
    try {
        // On cherche le projet par son ID ET on s'assure que celui qui supprime est bien le propriétaire
        const project = await Project.findOneAndDelete({ 
            _id: req.params.id, 
            owner: req.user.id 
        });

        if (!project) {
            return res.status(404).json({ error: 'Projet non trouvé ou vous n\'êtes pas autorisé à le supprimer' });
        }

        res.json({ message: 'Projet supprimé avec succès' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};