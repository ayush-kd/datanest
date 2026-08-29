function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-icon">
          <Icon size={20} />
        </div>

        {trend && (
          <span className="stat-trend">
            {trend}
          </span>
        )}
      </div>

      <p>{title}</p>

      <h2>{value}</h2>

      <span className="stat-description">
        {description}
      </span>
    </div>
  );
}

export default StatCard;