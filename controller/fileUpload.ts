import fs from "fs";
import { v4 as uuid } from "uuid";
import { promisify } from "util";
import Busboy from "busboy";
import path from "path/posix";
import { Request, Response } from "express";

let instance: null | FileUploadController = null;

const getFileDetails = promisify(fs.stat);

class FileUploadController {
  static getInstance(): FileUploadController {
    if (instance === null) {
      instance = new FileUploadController();
      return instance;
    }
    return instance;
  }

  getFilePath(fileName: string, fileId: string): string {
    return `./documents/file-${fileId}-${fileName}`;
  }

  async uploadRequest(req: Request, res: Response) {
    if (!req.body || !req.body.fileName) {
      res.status(400).json({ message: 'Missing "fileName"' });
    } else {
      const fileId = uuid();
      // const a = this.getFilePath(req.body.fileName, fileId)
      const saveTo = path.join(
        path.join(
          __dirname,
          "/../documents/" + `${fileId}-${req.body.fileName}`
        )
      );
      fs.createWriteStream(saveTo, { flags: "w" });
      res.status(200).json({ fileId });
    }
  }

  async uploadFile(req: Request, res: Response) {
    const contentRange = req.headers["content-range"];
    const fileId = req.headers["x-file-id"];

    if (!contentRange) {
      console.log("Missing Content-Range");
      return res
        .status(400)
        .json({ message: 'Missing "Content-Range" header' });
    }

    if (!fileId) {
      console.log("Missing File Id");
      return res.status(400).json({ message: 'Missing "X-File-Id" header' });
    }

    const match = contentRange.match(/bytes=(\d+)-(\d+)\/(\d+)/);

    if (!match) {
      console.log("Invalid Content-Range Format");
      return res
        .status(400)
        .json({ message: 'Invalid "Content-Range" Format' });
    }

    const rangeStart = Number(match[1]);
    const rangeEnd = Number(match[2]);
    const fileSize = Number(match[3]);

    if (
      rangeStart >= fileSize ||
      rangeStart >= rangeEnd ||
      rangeEnd > fileSize
    ) {
      return res
        .status(400)
        .json({ message: 'Invalid "Content-Range" provided' });
    }

    const busboy = Busboy({ headers: req.headers });

    busboy.on("file", (_, file:any, fileName: any) => {
      console.log(fileName, fileId);
      const filePath = path.join(
        path.join(
          __dirname,
          "/../documents/" + `${fileId}-${fileName?.filename}`
        )
      );

      if (!fileId) {
        req.pause();
      }

      getFileDetails(filePath)
        .then((stats) => {
          if (stats.size !== rangeStart) {
            return res.status(400).json({ message: 'Bad "chunk" provided' });
          }

          file
            .pipe(fs.createWriteStream(filePath, { flags: "a" }))
            .on("error", (e: any) => {
              console.error("failed upload", e);
              res.status(500).json({
                success: false,
                message: "Something went wrong please try again.",
              });
            });
        })
        .catch((err) => {
          console.log("No File Match", err);
          res.status(400).json({
            message: "No file with such credentials",
            credentials: req.query,
          });
        });
    });

    busboy.on("error", (e: any) => {
      console.error("failed upload", e);
      res.status(500).json({
        success: false,
        message: "Something went wrong please try again.",
      });
    });

    busboy.on("finish", () => {
      res
        .status(200)
        .json({ success: true, message: "File uploaded successfully" });
    });

    req.pipe(busboy);
  }

  async getUploadingFileDetails(req: Request, res: Response) {
    if (req.query && req.query.fileName && req.query.fileId) {
      const filePath = path.join(
        path.join(
          __dirname,
          "/../documents/" + `${req.query.fileId}-${req.query.fileName}`
        )
      );
      getFileDetails(filePath)
        .then((stats) => {
          res.status(200).json({ totalChunkUploaded: stats.size });
        })
        .catch((err) => {
          console.error("failed to read file", err);
          res.status(400).json({
            message: "No file with such credentials",
            credentials: req.query,
          });
        });
    }
  }
}

export default FileUploadController.getInstance();
