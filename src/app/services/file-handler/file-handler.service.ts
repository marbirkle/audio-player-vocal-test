import { Injectable, signal, WritableSignal } from "@angular/core";
import { Http, knownFolders, File } from "@nativescript/core";

/**
 * @description
 * Service dedicated to handling file-related operations, such as
 * downloading and local path management. This adheres to the Single
 * Responsibility Principle (SRP) by separating file logic from
 * other business logic.
 */
@Injectable({ providedIn: "root" })
export class FileHandlerService {
  public fileLastModifiedDate: WritableSignal<Date | null> =
    signal<Date | null>(null);

  constructor() {}

  /**
   * @description
   * Downloads a file from a given URL and returns its local file path.
   * This method is highly reusable and testable as it is purely focused
   * on file I/O operations.
   * @param url The remote URL of the file to download.
   * @returns A promise that resolves with the local file path.
   */
  public async getLocalFilePath(url: string): Promise<string> {
    try {
      const fileName = url.split("/").pop() || "downloaded_file";
      const temp = knownFolders.temp();
      const localFile = File.fromPath(`${temp.path}/${fileName}`);
      await Http.getFile(url, localFile.path);

      // Update the signal for the file's last modified date
      this.fileLastModifiedDate.set(localFile.lastModified);

      return localFile.path;
    } catch (error) {
      throw new Error(`Failed to download file from URL: ${url}`);
    }
  }
}
