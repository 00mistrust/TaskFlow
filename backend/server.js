// Déclaration des endpoints de l'API
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Bloc de log pour voir les routes chargées dans Render
console.log("=== ROUTES ENREGISTRÉES ===");
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`Route disponible: ${r.route.path}`);
  } else if (r.name === 'router') {
    r.handle.stack.forEach((s) => {
      if (s.route) {
        console.log(`Route d'un sous-dossier: ${s.route.path}`);
      }
    });
  }
});
console.log("===========================");

// Route de test d'accueil
app.get('/', (req, res) => res.json({ message: 'Nice Job Team, proud of you ALL, now time to show up !' }));