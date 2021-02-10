$(function () {
  const getFileUploaderInstance = () => {
    return $("#file-uploader").dxFileUploader("instance");
  };
  const onValueChanged = (e) => {
    customFileList.onValueChanged(e);
  };
  const onProgress = (e) => {
    customFileList.onProgress(e);
  };
  const onUploadStarted = (e) => {
    customFileList.onUploadStarted(e);
  };
  const onUploaded = (e) => {
    customFileList.onUploaded(e);
  };
  const onUploadError = (e) => {
    customFileList.onUploadError(e);
  };

  const fileUploader = $("#file-uploader")
    .dxFileUploader({
      name: "myFile",
      multiple: true,
      accept: "*",
      uploadMode: "useButtons",
      showFileList: false,
      uploadUrl: "http://172.22.4.236/FileUploader/UploadFileWithLink",
      allowedFileExtensions: [".jpg", ".jpeg", ".gif", ".png", ".zip"],
      maxFileSize: 100000,
      minFileSize: 100,
      onProgress: onProgress,
      onValueChanged: onValueChanged,
      onUploadStarted: onUploadStarted,
      onUploaded: onUploaded,
      onUploadError: onUploadError,
    })
    .dxFileUploader("instance");
  const customFileList = new CustomFileList(
    "custom-file-list-container",
    fileUploader
  );
});
