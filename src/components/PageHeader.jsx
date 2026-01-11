const PageHeader = ({ title, subtitle, children }) => {
  return (
    <header className="flex-shrink-0 bg-gradient-to-br from-primary-600 to-primary-700 text-white sticky top-0 z-10">
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-primary-100 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {children}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
