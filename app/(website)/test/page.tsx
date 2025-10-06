"use client";

import React, { useState } from "react";
import axios from "axios";

const VideoUploader = () => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState("");

  const presignedUrl =
    "https://flimsabucket.s3.us-east-2.amazonaws.com/askd?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQOMKTO3OWMA4YL7Y%2F20251006%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20251006T045842Z&X-Amz-Expires=3600&X-Amz-Signature=24e77ef161c2544b0194a30b7233544c441003fb4b64c1e9bba8b33de6b16748&X-Amz-SignedHeaders=host&partNumber=1&uploadId=3Ot4W_curHp97kR3kvNbhiQTBf9iQj5zo_PMk5AgYeBIj.cvpWQoEbhw_ZIre8oihoUefJ.V_rkj5jB_Gn29.C5tJaSSuFBRxe2zlR_iRXE4KhUfq4QkVH8kfvqf4pyt";

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setProgress(0);
    setUploadedUrl("");
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    try {
      await axios.put(presignedUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percent);
        },
      });

      // Construct the final S3 file URL
      const urlParts = presignedUrl.split("?");
      setUploadedUrl(urlParts[0]);

      alert("Upload successful!");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed, check console.");
    }
  };

  return (
    <div className="p-4 border rounded-md max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-2">Upload Video</h2>
      <input type="file" accept="video/*" onChange={handleFileChange} />
      {file && (
        <>
          <p className="mt-2">File: {file.name}</p>
          <button
            onClick={handleUpload}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Upload
          </button>
          {progress > 0 && <p className="mt-2">Progress: {progress}%</p>}
        </>
      )}
      {uploadedUrl && (
        <p className="mt-2 text-green-600">
          File uploaded successfully:{" "}
          <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">
            View Video
          </a>
        </p>
      )}
    </div>
  );
};

export default VideoUploader;
