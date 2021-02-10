const CustomFileList = function (containerID, fileUploaderComponent) {
  this.fileItemsArray = [];
  this.containerID = containerID;
  this.fileUploaderComponent = fileUploaderComponent;

  this.getFileItem = (file) => {
    return this.fileItemsArray.find((item) => item.file == file);
  };
  this.getValidationRules = () => {
    const minFileSize = this.fileUploaderComponent.option("minFileSize");
    const maxFileSize = this.fileUploaderComponent.option("maxFileSize");
    const allowedFileExtensions = this.fileUploaderComponent.option(
      "allowedFileExtensions"
    );
    return { minFileSize, maxFileSize, allowedFileExtensions };
  };

  this.onValueChanged = (e) => {
    this.getFilesContainer().toggle(e.value.length > 0);
    e.value.forEach((file) => {
      if (this.getFileItem(file) == null) {
        const fileItem = new FileItem(file);
        this.fileItemsArray.push(fileItem);
        this.createFileItemElement(fileItem);
        fileItem.Validate(this.getValidationRules());
      }
    });
  };
  this.onProgress = (e) => {
    const { file, bytesTotal, bytesLoaded } = e;
    const progress = Math.round((bytesLoaded / bytesTotal) * 100);
    this.getFileItem(file).setUploadProgress(progress);
  };
  this.onUploadStarted = (e) => {
    const { file } = e;
    this.getFileItem(file).setState(FileState.UploadInProgress);
  };
  this.onUploaded = (e) => {
    const { file } = e;
    const { uniqueName } = JSON.parse(e.request.response);
    const fileItem = this.getFileItem(file);
    fileItem.uniqueName = uniqueName;
    fileItem.setState(FileState.Uploaded);
  };
  this.onUploadError = (e) => {
    const { file } = e;
    this.getFileItem(file).setState(FileState.UploadError);
  };

  this.onCanceFileClick = (fileItem) => {
    if (fileItem.fileState === FileState.UploadInProgress) {
    } else {
      this.fileUploaderComponent.removeFile(fileItem.file);
      this.removeFileElement(fileItem);
    }
  };
  this.onUploadFileClick = (fileItem) => {
    this.fileUploaderComponent.upload(fileItem.file);
  };

  this.createFileItemElement = (fileItem) => {
    const fileElement = this.getTemplateFileItem().clone();
    fileElement.attr("id", fileItem.id);

    this.createCancelButton(fileItem, fileElement);
    this.createUploadButton(fileItem, fileElement);

    fileElement.find(".file-name-text").text(fileItem.file.name);
    fileElement.find(".size-text").text(fileItem.getFileSizeText());

    this.getFilesContainer().append(fileElement);
    fileElement.toggle();

    fileItem.fileElementRef = fileElement;
  };
  this.removeFileElement = (fileItem) => {
    $(`#${fileItem.id}`).remove();
  };
  this.createUploadButton = (fileItem, fileItemElement) => {
    fileItemElement.find(".upload-button-container").dxButton({
      icon: "upload",
      onClick: () => this.onUploadFileClick(fileItem),
    });
  };
  this.createCancelButton = (fileItem, fileItemElement) => {
    fileItemElement.find(".cancel-button-container").dxButton({
      icon: "close",
      onClick: () => this.onCanceFileClick(fileItem),
    });
  };
  this.getTemplateFileItem = () => {
    return $("#templateFileItem");
  };
  this.getFilesContainer = () => {
    return $(`#${this.containerID}`);
  };
};
const downloadFileAddress = `http://172.22.4.236/FileUploader/DownloadFile`;
const downLoadFile = (uniqueName) => {
  window.open(`${downloadFileAddress}?uniqueName=${uniqueName}`, "_blank");
};

const FileItem = function (file) {
  this.file = file;
  this.id = uuidv4();
  this.fileState = FileState.ReadyToUpload;
  this.uploadProgress = 0;
  this.uniqueName = "";
  this.fileElementRef = null;
  this.validationErrorText = "";
  this.Validate = (validationRules) => {
    if (!this.isValid(validationRules)) {
      this.setState(FileState.ValidationError);
    } else {
      this.setState(FileState.ReadyToUpload);
    }
  };
  this.isValidFileExtesion = (allowedFileExtensions) => {
    const { name } = this.file;
    const fileExtension = `.${name.split(".").pop()}`;
    const isValid = allowedFileExtensions.includes(fileExtension);
    this.validationErrorText = !isValid ? "File type is not allowed" : "";
    return isValid;
  };
  this.isValidMaxSize = (maxFileSize) => {
    const { size } = this.file;
    const isValid = maxFileSize != 0 && size <= maxFileSize;
    this.validationErrorText = !isValid ? "Max size error" : "";
    return isValid;
  };
  this.isValidMinSize = (minFileSize) => {
    const { size } = this.file;
    const isValid = size >= minFileSize;
    this.validationErrorText = !isValid ? "Min size error" : "";
    return isValid;
  };
  this.isValid = (validationRules) => {
    const { minFileSize, maxFileSize, allowedFileExtensions } = validationRules;
    return (
      this.isValidFileExtesion(allowedFileExtensions) &&
      this.isValidMaxSize(maxFileSize) &&
      this.isValidMinSize(minFileSize)
    );
  };

  this.getFileSizeText = (fileSize = this.file.size) => {
    const measures = ["bytes", "kb", "Mb", "Gb"];
    const divider = 1024;
    const maxSize = divider ** 4 - 1;
    if (fileSize > maxSize) {
      return `${fileSize} bytes`;
    }
    let measureIndex = 0;
    while (fileSize > divider) {
      fileSize /= divider;
      measureIndex++;
    }
    return `${Math.round(fileSize)} ${measures[measureIndex]}`;
  };

  this.setUploadProgress = (val) => {
    this.uploadProgress = val;
    this.getProgressBar().option("value", val);
  };
  this.setState = (val) => {
    if (val === FileState.UploadInProgress) {
      this.createProgressBar();
      this.fileElementRef.find(".upload-button-container").toggle(false);
      this.fileElementRef.find(".status-message").toggle(false);
    } else if (val === FileState.Uploaded) {
      this.disposeProgressBar();
      this.fileElementRef.find(".upload-button-container").dxButton("dispose");
      this.fileElementRef.find(".upload-button-container").toggle(false);
      this.fileElementRef.find(".download-button-container").toggle(true);
      this.SetStatusMessage("Ready to download");
      this.createDownloadButton();
    } else if (val === FileState.ValidationError) {
      this.fileElementRef.find(".upload-button-container").toggle(false);
      this.SetErrorStatusMessage(this.validationErrorText);
    } else if (val === FileState.ReadyToUpload) {
      if (this.fileState === FileState.UploadError) return;
      this.fileElementRef.find(".upload-button-container").toggle(true);
      this.SetStatusMessage("Ready to upload");
    } else if (val === FileState.UploadError) {
      this.SetErrorStatusMessage("Upload Error");
      this.disposeProgressBar();
    }
    this.fileState = val;
  };
  this.SetStatusMessage = (message) => {
    this.fileElementRef.find(".status-message").removeClass("error-message");
    this.fileElementRef.find(".status-message").text(message);
    this.fileElementRef.find(".status-message").toggle(true);
  };
  this.SetErrorStatusMessage = (message) => {
    this.SetStatusMessage(message);
    this.fileElementRef.find(".status-message").addClass("error-message");
  };
  this.getProgressBar = () => {
    return $(progressBarId()).dxProgressBar("instance");
  };
  this.createProgressBar = () => {
    this.fileElementRef
      .find(".progress-bar-container")
      .attr("id", `progressBar_${this.id}`);
    $(progressBarId()).dxProgressBar({});
  };
  this.disposeProgressBar = () => {
    $(progressBarId()).dxProgressBar("dispose");
    $(progressBarId()).remove();
  };
  const progressBarId = () => {
    return `#progressBar_${this.id}`;
  };
  this.onDownloadButtonClick = () => {
    downLoadFile(this.uniqueName);
  };
  this.createDownloadButton = () => {
    this.fileElementRef.find(".download-button-container").dxButton({
      icon: "download",
      onClick: () => this.onDownloadButtonClick(),
    });
  };
};
const uuidv4 = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
const FileState = Object.freeze({
  ReadyToUpload: 0,
  UploadInProgress: 1,
  Uploaded: 2,
  ValidationError: 3,
  UploadError: 4,
});
