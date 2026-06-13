require("dotenv").config();
const mongoose = require("mongoose");
const Movie = require("../models/Movie");

const shouldApply = process.argv.includes("--apply");

const cleanupDuplicateMovies = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const duplicateGroups = await Movie.aggregate([
    {
      $sort: {
        updatedAt: -1,
        createdAt: -1,
      },
    },
    {
      $group: {
        _id: {
          userId: "$userId",
          videoId: "$videoId",
          category: "$category",
        },
        ids: { $push: "$_id" },
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
  ]);

  const idsToRemove = duplicateGroups.flatMap((group) => group.ids.slice(1));

  console.log(`Duplicate groups found: ${duplicateGroups.length}`);
  console.log(`Duplicate records to remove: ${idsToRemove.length}`);

  if (!shouldApply) {
    console.log("Dry run only. Re-run with --apply to delete duplicate records.");
    return;
  }

  if (idsToRemove.length === 0) {
    console.log("Nothing to remove.");
    return;
  }

  const result = await Movie.deleteMany({ _id: { $in: idsToRemove } });
  console.log(`Removed ${result.deletedCount} duplicate records.`);
};

cleanupDuplicateMovies()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
