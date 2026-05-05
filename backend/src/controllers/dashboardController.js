exports.getDashboard = async (req, res) => {
  try {
    res.json({
      projetsActifs: 0,
      tachesAssignees: 0,
      tachesTerminees: 0,
      tachesRetard: 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};