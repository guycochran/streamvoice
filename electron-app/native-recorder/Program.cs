using System.Text;
using NAudio.Wave;

static string? GetArg(string[] args, string name)
{
    var index = Array.IndexOf(args, name);
    if (index >= 0 && index + 1 < args.Length)
    {
        return args[index + 1];
    }

    return null;
}

var outputPath = GetArg(args, "--output");
if (string.IsNullOrWhiteSpace(outputPath))
{
    Console.Error.WriteLine("Missing --output path");
    return 1;
}

var requestedDeviceId = GetArg(args, "--device-id");
var requestedDeviceLabel = GetArg(args, "--device-label");

Directory.CreateDirectory(Path.GetDirectoryName(outputPath)!);

int selectedDeviceNumber = -1;
for (var index = 0; index < WaveInEvent.DeviceCount; index += 1)
{
    var capabilities = WaveInEvent.GetCapabilities(index);
    if (!string.IsNullOrWhiteSpace(requestedDeviceLabel) &&
        capabilities.ProductName.Equals(requestedDeviceLabel, StringComparison.OrdinalIgnoreCase))
    {
        selectedDeviceNumber = index;
        break;
    }

    if (!string.IsNullOrWhiteSpace(requestedDeviceId) &&
        requestedDeviceId.Equals(index.ToString(), StringComparison.OrdinalIgnoreCase))
    {
        selectedDeviceNumber = index;
        break;
    }
}

if (selectedDeviceNumber < 0)
{
    selectedDeviceNumber = 0;
}

if (WaveInEvent.DeviceCount <= 0)
{
    Console.Error.WriteLine("No recording devices available");
    return 2;
}

using var waveIn = new WaveInEvent
{
    DeviceNumber = selectedDeviceNumber,
    WaveFormat = new WaveFormat(16000, 16, 1),
    BufferMilliseconds = 100
};

using var writer = new WaveFileWriter(outputPath, waveIn.WaveFormat);
var stopSignal = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
var errorSignal = new TaskCompletionSource<Exception>(TaskCreationOptions.RunContinuationsAsynchronously);

waveIn.DataAvailable += (_, eventArgs) =>
{
    writer.Write(eventArgs.Buffer, 0, eventArgs.BytesRecorded);
    writer.Flush();
};

waveIn.RecordingStopped += (_, eventArgs) =>
{
    if (eventArgs.Exception is not null)
    {
        errorSignal.TrySetResult(eventArgs.Exception);
        return;
    }

    stopSignal.TrySetResult();
};

waveIn.StartRecording();
Console.Out.WriteLine("READY");
Console.Out.Flush();

_ = Task.Run(async () =>
{
    using var reader = new StreamReader(Console.OpenStandardInput(), Encoding.UTF8);
    while (true)
    {
        var line = await reader.ReadLineAsync();
        if (line is null)
        {
            waveIn.StopRecording();
            break;
        }

        if (line.Trim().Equals("STOP", StringComparison.OrdinalIgnoreCase))
        {
            waveIn.StopRecording();
            break;
        }
    }
});

var completedTask = await Task.WhenAny(stopSignal.Task, errorSignal.Task);
if (completedTask == errorSignal.Task)
{
    Console.Error.WriteLine(errorSignal.Task.Result.Message);
    return 3;
}

return 0;
