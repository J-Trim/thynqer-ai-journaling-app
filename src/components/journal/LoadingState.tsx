const LoadingState = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded w-full" />
        <div className="h-40 bg-gray-200 rounded w-full" />
        <div className="h-10 bg-gray-200 rounded w-1/4 ml-auto" />
      </div>
    </div>
  );
};

export default LoadingState;